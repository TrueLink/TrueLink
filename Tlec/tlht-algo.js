"use strict";

var SHA1 = require("modules/cryptography/sha1-crypto-js");
var Hex = require("Multivalue/multivalue/hex");
var BitArray = require("Multivalue/multivalue/bitArray");
var Bytes = require("Multivalue/multivalue/bytes");
var Aes = require("modules/cryptography/aes-sjcl");

var invariant = require("invariant");
var Multivalue = require("Multivalue").multivalue.Multivalue;

TlhtAlgo.HashCount = 1000;
TlhtAlgo.MinHashtailsWanted = 3;

/*
    hashtail structure:
    {
        for those pushed from the outside or generated
        (used for hashing)
        owner: string
            owner = pushed value
            only those owner === algo._id may be used
        start: Multivalue
            default = pushed value
            also used an secondary identifier
        cache: Multivalue[]
            default = [start, hash(start), hash(hash(start)), ..., hash(...(hash(start)))]: TlhtAlgo.HashCount items
            not serialized
        hashCounter: int
            default = ThltAlgo.HashCount
            dec by 1 on every successfull hash
            used to check if not expired and to get hash num

        for those pulled out of channel (our and their ones)
        (used for checks)
        checkCounter: int
            default = ThltAlgo.HashCount
            dec by 1 on every successfull check
            used to check if not expired
        end: Multivalue
            default = pulled value
            also used as identifier
        current: Multivalue
            default = end
            replaced by previous hash on every successfull check
    }
*/

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

    return this._ourHashes.filter(function (hashInfo) {
        return hashInfo.counter > 1 && hashInfo.owner === cowriter; 
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
    var hashInfo = this._chooseHashtail();
    this._ourHashes.splice(this._ourHashes.indexOf(hashInfo), 1);
    hashInfo.owner = newOwnerId;
    return hashInfo;
}

TlhtAlgo.prototype.processHashtail = function (hashInfo) {
    invariant(this._id, "processHashtail is disabled in single mode");
    var existingHashInfoArr = this._ourHashes.filter(function (_hashInfo) {
        return hashInfo.start.as(Hex).isEqualTo(_hashInfo.start.as(Hex));
    });
    if (existingHashInfoArr.length) {
        this._ourHashes.splice(this._ourHashes.indexOf(existingHashInfoArr[0]), 1);
    }
    this._ourHashes.push(hashInfo);
    return !!existingHashInfoArr.length;
}

TlhtAlgo.prototype._isHashValid = function (hx, isEcho) {
    // first time check, is used for initial hashtail exchange
    if (!this._isFirstHashChecked && !isEcho) {
        if (hx.as(Hex).value === "00000000000000000000000000000000") {
            this._isFirstHashChecked = true;
            return true;
        }        
        return false;
    }

    if (!this._isFirstEchoHashChecked && isEcho) {
        if (hx.as(Hex).value === "00000000000000000000000000000000") {
            this._isFirstEchoHashChecked = true;
            return true;
        }        
        return false;
    }

    var hashes = isEcho ? this._ourHashes : this._theirHashes;

    invariant(hashes, "hash checker: channel is not configured");

    for (var hashIndex = 0; hashIndex < hashes.length; hashIndex++) {
        var hashInfo = hashes[hashIndex];


        var end = (isEcho ? hx : hashInfo.end).as(Hex).value;
        var start = isEcho ? hashInfo.start : hx;

        for (var i = 0; i < TlhtAlgo.HashCount; i++) {
            start = this._hash(start);
            if (start.as(Hex).value === end) {
                return true;
            }
        }
    }
    return false;
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
        return new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }

    invariant(this._ourHashes, "hash getter: channel is not configured");

    var hashInfo = this._chooseHashtail();

    var hx = hashInfo.start;
    for (var i = 0; i < hashInfo.counter; i++) {
        hx = this._hash(hx);
    }
    hashInfo.counter--;    

    return hx;    
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

TlhtAlgo.prototype.getCowritersWithoutHashtails = function () {
    invariant(this._id, "getCowritersWithoutHashtails is disabled in single mode");
    var owners = this._ourHashes.reduce(function (owners, hashInfo) {
        owners[hashInfo.owner] = true;
    }, {});
    return this._cowriters.filter(function (cowriter) {
        !owners[cowriter];
    });
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
    var hashInfo = {
        start: this._random.bitArray(128),
        counter: TlhtAlgo.HashCount - 1,
        owner: this._id
    };
    var hashEnd = hashInfo.start;
    for (var i = 0; i < TlhtAlgo.HashCount; i++) {
        hashEnd = this._hash(hashEnd);
    }
    return {
        hashEnd: hashEnd,
        hashInfo: hashInfo
    };
}

TlhtAlgo.prototype.isHashReady = function () {
    return !!(this._ourHashes && this._theirHashes && this._ourHashes.length && this._theirHashes.length);
}

TlhtAlgo.prototype.createMessage = function (raw, hash) {
    var message = this.hashMessage(raw);
    return message;
}

TlhtAlgo.prototype.pushMyHashInfo = function (hashInfo) {
    if (!this._ourHashes) { this._ourHashes = []; }
    this._ourHashes.push(hashInfo);
}
TlhtAlgo.prototype.setHashEnd = function (hashEnd) {
    if (!this._theirHashes) { this._theirHashes = []; }
    this._theirHashes.push({
        end: hashEnd
    });
}





TlhtAlgo.prototype.deserialize = function (data) {
    this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
    this._cowriters = data.cowriters;
    this._ourHashes = !data.myHashes ? null : 
        data.myHashes.map(function (hashInfo) {
            return {
                start: Hex.deserialize(hashInfo.start),
                counter: hashInfo.counter,
                owner: hashInfo.owner
            }
        });
    this._theirHashes = !data.herHashes ? null : 
        data.herHashes.map(function (hashInfo) {
            return {
                end: Hex.deserialize(hashInfo.end)
            }
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
            this._ourHashes.map(function (hashInfo) {
                return {
                    start: hashInfo.start.as(Hex).serialize(),
                    counter: hashInfo.counter,
                    owner: hashInfo.owner
                }
            }),
        herHashes: !this._theirHashes ? null :
            this._theirHashes.map(function (hashInfo) {
                return {
                    end: hashInfo.end.as(Hex).serialize()
                }
            }),
        isFirstHashChecked: this._isFirstHashChecked,
        isFirstEchoHashChecked: this._isFirstEchoHashChecked,
        isFirstHashGenerated: this._isFirstHashGenerated,
        id: this._id   
    };
}

TlhtAlgo.prototype._hash = function (value) {
    return SHA1(value).as(BitArray).bitSlice(0, 128);
}

module.exports = TlhtAlgo;