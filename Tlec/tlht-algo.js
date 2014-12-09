"use strict";

var SHA1 = require("modules/cryptography/sha1-crypto-js");
var Hex = require("Multivalue/multivalue/hex");
var BitArray = require("Multivalue/multivalue/bitArray");
var Bytes = require("Multivalue/multivalue/bytes");
var Aes = require("modules/cryptography/aes-sjcl");

var invariant = require("invariant");
var Multivalue = require("Multivalue").multivalue.Multivalue;


Hashtail.HashCount = 1000;

Hashtail.deserialize = function (data) {
    var hashtail = new Hashtail();
    hashtail._owner = data.owner;
    hashtail._start = data.start ? Hex.deserialize(data.start) : null;
    hashtail._hashCounter = data.hashCounter;

    hashtail._checkCounter = data.checkCounter;
    hashtail._end = data.start ? Hex.deserialize(data.end) : null;
    hashtail._current = data.start ? Hex.deserialize(data.current) : null; 
}

Hashtail.isFirstHashValid = function (hash) {
    invariant(hash, "hash must be multivalue");
    
    return hash.as(Hex).value === "00000000000000000000000000000000";
}

Hashtail.getFirstHash = function () {
    return new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

Hashtail.hash = function (value) {
    return SHA1(value).as(BitArray).bitSlice(0, 128);
}


function Hashtail() {
    this._owner = null;
    this._start = null;
    this._cache = null;
    this._hashCounter = null;

    this._checkCounter = null;
    this._end = null;
    this._current = null;
}

Hashtail.prototype.serialize = function () {
    return {
        owner: this._owner,
        stat: this._start ? this._start.as(Hex).serialize() : null,
        hashCounter: this._hashCounter,

        checkCounter: this._checkCounter,
        end: this._end ? this._end.as(Hex).serialize() : null,
        current: this._current ? this._current.as(Hex).serialize() : null,
    };
}

Hashtail.prototype.isActiveAndOwnedBy = function (owner) {
    return this._start && this._hashCounter > 1 && this._owner === owner;
}

// returns data to be sent to delegation target
Hashtail.prototype.delegate = function (newOwner) {
    this._owner = newOwner;
    return {
        owner: this._owner,
        start: this._start,
        hashCounter: this._hashCounter,

        end: this._end // used for identification
    };
}

Hashtail.prototype.isItYou = function (end) {
    invariant(this._end, "hashtail has no end");
    invariant(end && (end instanceof Multivalue), "end must be multivalue");
    
    // end is used as id
    if (this._end) { return this._end.as(Hex).isEqualTo(end.as(Hex)); }
    
    return false  
}

Hashtail.prototype.initWithStart = function (hashInfo) {
    invariant(!this._start || this._start.as(Hex).isEqualTo(hashInfo.start.as(Hex)), 
        "cannot initWithStart: start is already set and differs"); 

    this._owner = hashInfo.owner;
    this._start = hashInfo.start.as(Hex);
    this._hashCounter = hashInfo.hashCounter || Hashtail.HashCount;

    if (!this._end) {
        this._populateCache(Hashtail.HashCount);
        this.initWithEnd(this._cache[Hashtail.HashCount]);
    }

    return this._end;
}

Hashtail.prototype.initWithEnd = function (end) {
    this._end = end.as(Hex);
    this._current = this._end;
    this._checkCounter = Hashtail.HashCount;
}

// mutates hashtail!
Hashtail.prototype.isHashValid = function (hash) {
    invariant(hash, "hash must be multivalue");
    invariant(this._end, "cannot check hash: end is not set");

    var hashhash = Hashtail.hash(hash);
    if (hashhash.as(Hex).isEqualTo(this._current.as(Hex))) {
        this._current = hash.as(Hex);
        this._checkCounter--;
        return true;
    }
    return false;
}

// mutates hashtail!
Hashtail.prototype.getNextHash = function () {
    invariant(this._start, "cannot get hash: start is not set");

    this._hashCounter--;
    this._populateCache(this._hashCounter);
    return this._cache[this._hashCounter];
}

Hashtail.prototype._populateCache = function (counter) {
    if (!this._cache) {
        this._cache = [];
    }
    var cache = this._cache;

    if (!cache[counter]) {
        var hx = cache[1] = this._start;
        for (var i = 2; i <= counter; i++) {
            hx = cache[i] = Hashtail.hash(hx);
        }  
    }
}





TlhtAlgo.MinHashtailsWanted = 3;

//todo: this is for tests only, move ht into separate file
TlhtAlgo.Hashtail = Hashtail;

function TlhtAlgo(random, id) {
    this._random = random;

    this._dhAesKey = null;
    this._id = null;
    this._cowriters = [];

    this._ourHashes = null;
    this._theirHashes = null;

    this._isFirstHashChecked = false;
    this._isFirstEchoHashChecked = false;
    this._isFirstHashGenerated = false;
}

TlhtAlgo.prototype.init = function (args, sync) {
    invariant(args.key instanceof Multivalue, "args.key must be multivalue");    
    invariant(this._random, "rng is not set");

    // assume single mode (no cowriters) if profileId not set
    invariant(!args.profileId || (typeof args.profileId === "string"), "args.profileId must be string");
    
    this._dhAesKey = args.key;
    this._id = args.profileId;

    if (sync) {
        //TODO 'sync' should not be needed here!

        this._ourHashes = [];
        this._theirHashes = [];

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
    invariant(!this.isExpired(), "This channel is expired");

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

TlhtAlgo.prototype.isExpired = function () {
    // if (!this._ourHashes) -- then we are not expired, we are unconfigured yet
    return this._ourHashes && (this._getMyActiveHashes().length === 0);
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
    });

    return {
        hashEnd: end,
        hashtail: ht
    };
}

TlhtAlgo.prototype.isHashReady = function () {
    return !!(this._ourHashes && this._theirHashes && this._ourHashes.length && this._theirHashes.length);
}

TlhtAlgo.prototype.createMessage = function (raw, hash) {
    var message = this.hashMessage(raw);
    return message;
}

TlhtAlgo.prototype.pushMyHashtail = function (ht) {
    if (!this._ourHashes) { this._ourHashes = []; }
    this._ourHashes.push(ht);
}

TlhtAlgo.prototype.setHashEnd = function (hashEnd, isEcho) {
    var ht;

    if (isEcho) {
        if (!this._ourHashes) { this._ourHashes = []; }
        var existingHashInfoArr = this._ourHashes.filter(function (ht) {
            return ht.isItYou(hashEnd);
        });
        if (existingHashInfoArr.length) {
            ht = existingHashInfoArr[0];
        } else {
            this._ourHashes.push(ht = new Hashtail());
        } 
    } else {
        if (!this._theirHashes) { this._theirHashes = []; }
        this._theirHashes.push(ht = new Hashtail());
    }
        
    ht.initWithEnd(hashEnd);
}





TlhtAlgo.prototype.deserialize = function (data) {
    this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
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
        dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null,
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