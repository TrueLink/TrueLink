"use strict";

var SHA1 = require("modules/cryptography/sha1-crypto-js");
var Hex = require("Multivalue/multivalue/hex");
var BitArray = require("Multivalue/multivalue/bitArray");
var Bytes = require("Multivalue/multivalue/bytes");
var Aes = require("modules/cryptography/aes-sjcl");

var invariant = require("invariant");
var Multivalue = require("Multivalue").multivalue.Multivalue;

var DecryptionFailedError = require('./decryption-failed-error');

TlhtAlgo.HashCount = 1000;
TlhtAlgo.MinHashtailsWanted = 3;

function TlhtAlgo(random, id) {
    this._random = random;

    this._dhAesKey = null;
    this._id = null;
    this._cowriters = [];

    this._ourHashes = null;
    this._theirHashes = null;

    this._isFirstHashChecked = false;
    this._isFirstHashGenerated = false;
}

TlhtAlgo.prototype.init = function (args, sync) {
    invariant(args.key instanceof Multivalue, "args.key must be multivalue");
    invariant(typeof args.id === "string", "args.id must be string");
    invariant(this._random, "rng is not set");
    
    this._dhAesKey = args.key;
    this._id = args.id;

    if (sync) {
        this._ourHashes = [];
        this._theirHashes = [];

        this._isFirstHashChecked = true;
        this._isFirstHashGenerated = true;        
    }
}

TlhtAlgo.prototype._getMyActiveHashes = function () {
    return this._ourHashes.filter(function (hashInfo) {
        return hashInfo.counter > 1 && hashInfo.owner === this._id; 
    });    
}

TlhtAlgo.prototype._chooseHashtail = function () {
    myHashes = this._getMyActiveHashes();
    invariant(!this.isExpired(), "This channel is expired");

    var hashIndex = Math.floor(this._random.double() * this._ourHashes.length);
    return myHashes[hashIndex];
}

TlhtAlgo.prototype.takeHashtail = function (newOwnerId) {
    var hashInfo = this._chooseHashtail();
    this._ourHashes.splice(this._ourHashes(indexOf(hashInfo), 1);
    hashInfo.owner = newOwnerId;
    return hashInfo;
}

TlhtAlgo.prototype._isHashValid = function (hx) {
    // first time check, is used for initial hashtail exchange
    if (!this._isFirstHashChecked) {
        this._isFirstHashChecked = true;
        return hx.as(Hex).value === "00000000000000000000000000000000";
    }

    invariant(this._theirHashes, "channel is not configured");

    for (var hashIndex = 0; hashIndex < this._theirHashes.length; hashIndex++) {
        var hashInfo = this._theirHashes[hashIndex];

        var end = hashInfo.end.as(Hex).value;
        var gotTail = hx;
        for (var i = 0; i < TlhtAlgo.HashCount; i++) {
            gotTail = this._hash(gotTail);
            if (gotTail.as(Hex).value === end) {
                return true;
            }
        }
    }
    return false;
}

TlhtAlgo.prototype._getNextHash = function () {
    // first 'next hash', is used for initial hashtail exchange
    if (!this._isFirstHashGenerated) {
        this._isFirstHashGenerated = true;
        return new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }

    invariant(this._ourHashes, "channel is not configured");

    var hashInfo = this._chooseHashtail();

    var hx = hashInfo.start;
    for (var i = 0; i < hashInfo.counter; i++) {
        hx = this._hash(hx);
    }
    hashInfo.counter--;    

    return hx;    
}

TlhtAlgo.prototype.isExpired = function () {
    return this._getMyActiveHashes().length === 0;
}

TlhtAlgo.prototype.areEnoughHashtailsAvailable = function () {
    return this._getMyActiveHashes().length >= TlhtAlgo.MinHashtailsWanted;
}

TlhtAlgo.prototype.addCowriter = function (id) {
    this._cowriters.push(id);
}

TlhtAlgo.prototype.getCowritersWithoutHashtails = function () {
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

TlhtAlgo.prototype.processPacket = function (decryptedData) {
    var hx = decryptedData.bitSlice(0, 128);
    var netData = decryptedData.bitSlice(128, decryptedData.bitLength());

    if (!this._isHashValid(hx)) {
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
    var message = this._encrypt(this.hashMessage(raw));
    return message;
}

TlhtAlgo.prototype.processMessage = function (bytes) {
    var decryptedData = this._decrypt(bytes);
    return this.processPacket(decryptedData);
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
    this._isFirstHashChecked = data.isFirstHashChecked;
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
        isFirstHashGenerated: this._isFirstHashGenerated      
    };
}

TlhtAlgo.prototype._encrypt = function (bytes) {
    invariant(this._dhAesKey, "channel is not configured");
    var iv = this._random.bitArray(128);
    var aes = new Aes(this._dhAesKey);
    var encryptedData = aes.encryptCbc(bytes, iv);
    return iv.as(Bytes).concat(encryptedData);
}

TlhtAlgo.prototype._decrypt = function (bytes) {
    invariant(this._dhAesKey, "channel is not configured");
    var dataBitArray = bytes.as(BitArray);
    var iv = dataBitArray.bitSlice(0, 128);
    var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
    var aes = new Aes(this._dhAesKey);
    try {
        return aes.decryptCbc(encryptedData, iv);
    }
    catch (ex) {
        throw new DecryptionFailedError(ex);
    }
}

TlhtAlgo.prototype._hash = function (value) {
    return SHA1(value).as(BitArray).bitSlice(0, 128);
}

module.exports = TlhtAlgo;