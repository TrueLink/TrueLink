"use strict";

var invariant = require("invariant");

var multivalue = require("Multivalue");
var Multivalue = multivalue.multivalue.Multivalue;
var Hex = multivalue.Hex;
var BitArray = require("Multivalue/multivalue/bitArray");
var Bytes = require("Multivalue/multivalue/bytes");

var Hashtail = require("./hashtail");

TlhtAlgo.MinHashtailsWanted = 3;

function TlhtAlgo(random, id) {
    this._random = random;

    this._id = null;
    this._cowriters = [];

    this._ourHashes = [];
    this._theirHashes = [];

    this._isFirstHashChecked = false;
    this._isFirstEchoHashChecked = false;
    this._isFirstHashGenerated = false;
}

TlhtAlgo.prototype.init = function (args, sync) {
    invariant(this._random, "rng is not set");

    // assume single mode (no cowriters) if profileId not set
    invariant(!args.profileId || (typeof args.profileId === "string"), "args.profileId must be string");
    
    this._id = args.profileId;

    if (sync) {
        //TODO 'sync' should not be needed here!
        this._isFirstHashGenerated = true;        
    }
}

TlhtAlgo.prototype.getCowriterActiveHashes = function(cowriter) {
    invariant(this._id || !cowriter, "getCowriterActiveHashes is disabled in single mode");

    return this._ourHashes.filter(function (ht) {
        return ht.isActiveAndOwnedBy(cowriter); 
    }.bind(this));  
}

TlhtAlgo.prototype._getMyActiveHashes = function () {
    return this.getCowriterActiveHashes(this._id); 
}

TlhtAlgo.prototype._chooseHashtail = function () {
    var myHashes = this._getMyActiveHashes();
    invariant(!this.areAnyHashesAvailable(), "This channel is expired");

    var hashIndex = Math.floor(this._random.double() * myHashes.length);
    return myHashes[hashIndex];
}

TlhtAlgo.prototype.takeHashtail = function (newOwnerId) {
    return this._chooseHashtail().delegate(newOwnerId);
}

TlhtAlgo.prototype.processHashtail = function (hashInfo) {
    invariant(this._id, "processHashtail is disabled in single mode");
    var existingHashInfoArr = this._ourHashes.filter(function (ht) {
        return ht.isItYou(hashInfo.end);
    });

    var ht;

    if (existingHashInfoArr.length) {
        ht = existingHashInfoArr[0];
    } else {
        this._ourHashes.push(ht = new Hashtail());
    }
    ht.initWithStart(hashInfo);
}

TlhtAlgo.prototype._isHashValid = function (hx, isEcho) {
    // first time check, is used for initial hashtail exchange
    if (!this._isFirstHashChecked && !isEcho) {
        if (Hashtail.isFirstHashValid(hx)) {
            this._isFirstHashChecked = true;
            return true;
        }        
        return false;
    }

    if (!this._isFirstEchoHashChecked && isEcho) {
        if (Hashtail.isFirstHashValid(hx)) {
            this._isFirstEchoHashChecked = true;
            return true;
        }        
        return false;
    }

    var hashes = isEcho ? this._ourHashes : this._theirHashes;

    invariant(hashes, "hash checker: channel is not configured");

    return hashes.some(function (ht) { return ht.isHashValid(hx); });
}

TlhtAlgo.prototype.unhashedFirst = function (isEcho) {
    return isEcho
        ? this._isFirstEchoHashChecked
        : this._isFirstHashChecked;
}

TlhtAlgo.prototype._getNextHash = function () {
    // first 'next hash', is used for initial hashtail exchange
    if (!this._isFirstHashGenerated) {
        this._isFirstHashGenerated = true;
        return Hashtail.getFirstHash();
    }

    invariant(this._ourHashes, "hash getter: channel is not configured");

    return this._chooseHashtail().getNextHash();
}

// is truely expired if htReady was already called
TlhtAlgo.prototype.areAnyHashesAvailable = function () {
    return this._getMyActiveHashes().length === 0;
}

TlhtAlgo.prototype.areEnoughHashtailsAvailable = function () {
    return this._getMyActiveHashes().length >= TlhtAlgo.MinHashtailsWanted;
}

TlhtAlgo.prototype.addCowriter = function (id) {
    invariant(this._id, "addCowriter is disabled in single mode");
    this._cowriters.push(id);
}

TlhtAlgo.prototype.hashMessage = function (raw) {
    invariant(raw instanceof Multivalue, "raw must be multivalue");
    var hx = this._getNextHash();
    return hx.as(Bytes).concat(raw);
}

TlhtAlgo.prototype.processPacket = function (decryptedData, isEcho) {
    var hx = decryptedData.bitSlice(0, 128);
    var netData = decryptedData.bitSlice(128, decryptedData.bitLength());

    if (!this._isHashValid(hx, isEcho)) {
        return null;
    }
    
    return netData;
},


TlhtAlgo.prototype.generate = function () {
    var ht = new Hashtail();
    var end = ht.initWithStart({
        start: this._random.bitArray(128),
        owner: this._id
    }, true);

    this._ourHashes.push(ht);

    return end;
}

TlhtAlgo.prototype.isHashReady = function () {
    return !!(!this.areAnyHashesAvailable() && this._theirHashes.length);
}

TlhtAlgo.prototype.createMessage = function (raw, hash) {
    var message = this.hashMessage(raw);
    return message;
}

TlhtAlgo.prototype.activateHashEnd = function (hashEnd) {
    var existingHashInfoArr = this._ourHashes.filter(function (ht) {
        return ht.isItYou(hashEnd);
    });
    if (existingHashInfoArr.length) {
        existingHashInfoArr[0].activate();
    } else {
        // hashtail should exists by this time
        debugger;
    }
}

TlhtAlgo.prototype.setHashEnd = function (hashEnd, isEcho) {
    var ht;

    if (isEcho) {
        var existingHashInfoArr = this._ourHashes.filter(function (ht) {
            return ht.isItYou(hashEnd);
        });
        if (existingHashInfoArr.length) {
            ht = existingHashInfoArr[0];
        } else {
            this._ourHashes.push(ht = new Hashtail());
        } 
    } else {
        this._theirHashes.push(ht = new Hashtail());
    }
        
    ht.initWithEnd(hashEnd);
}





TlhtAlgo.prototype.deserialize = function (data) {
    this._cowriters = data.cowriters;
    this._ourHashes = !data.myHashes ? null : 
        data.myHashes.map(function (ht) {
            return Hashtail.deserialize(ht);
        });
    this._theirHashes = !data.herHashes ? null : 
        data.herHashes.map(function (ht) {
            return Hashtail.deserialize(ht);
        });
    this._id = data.id;
    this._isFirstHashChecked = data.isFirstHashChecked;
    this._isFirstEchoHashChecked = data.isFirstEchoHashChecked;
    this._isFirstHashGenerated = data.isFirstHashGenerated;
}

TlhtAlgo.prototype.serialize = function () {
    return {
        cowriters: this._cowriters,
        myHashes: !this._ourHashes ? null :
            this._ourHashes.map(function (ht) {
                return ht.serialize();
            }),
        herHashes: !this._theirHashes ? null :
            this._theirHashes.map(function (ht) {
                return ht.serialize();
            }),
        isFirstHashChecked: this._isFirstHashChecked,
        isFirstEchoHashChecked: this._isFirstEchoHashChecked,
        isFirstHashGenerated: this._isFirstHashGenerated,
        id: this._id   
    };
}

module.exports = TlhtAlgo;