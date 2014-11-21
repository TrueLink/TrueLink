"use strict";

var SHA1 = require("modules/cryptography/sha1-crypto-js");
var Hex = require("Multivalue/multivalue/hex");
var BitArray = require("Multivalue/multivalue/bitArray");
var Bytes = require("Multivalue/multivalue/bytes");
var Aes = require("modules/cryptography/aes-sjcl");

var invariant = require("invariant");

var invariant = require("invariant");
var Multivalue = require("Multivalue").multivalue.Multivalue;

var DecryptionFailedError = require('./decryption-failed-error');

TlhtAlgo.HashCount = 1000;

function TlhtAlgo(random) {
    this._random = random;

    this._dhAesKey = null;

    this._myHashes = null; //todo serialization
    this._herHashes = null; //todo serialization
}

TlhtAlgo.prototype.init = function (key) {
    invariant(this._random, "rng is not set");
    this._dhAesKey = key;
}

TlhtAlgo.prototype._isHashValid = function (hx) {
    invariant(this._herHashes, "channel is not configured");

    for (var hashIndex = 0; hashIndex < this._herHashes.length; hashIndex++) {
        var hashInfo = this._herHashes[hashIndex];

        var end = hashInfo.end.as(Hex).value;
        for (var i = 0; i < TlhtAlgo.HashCount; i++) {
            hx = this._hash(hx);
            if (hx.as(Hex).value === end) {
                return true;
            }
        }
    }

    return false;
}

TlhtAlgo.prototype._getNextHash = function () {
    invariant(this._myHashes, "channel is not configured");
    invariant(!this.isExpired(), "This channel is expired");

    var hashIndex = Math.floor(this._random.double() * this._myHashes.length);
    var hashInfo = this._myHashes[hashIndex];

    var hx = hashInfo.start;
    for (var i = 0; i < hashInfo.counter; i++) {
        hx = this._hash(hx);
    }
    hashInfo.counter--;

    return hx;    
}

TlhtAlgo.prototype.isExpired = function () {
    return (this._myHashes.filter(function (hashInfo) { return hashInfo.counter > 1; }).length === 0);
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
        counter: TlhtAlgo.HashCount - 1
    };
    var hashEnd = hashInfo.start;
    for (var i = 0; i < TlhtAlgo.HashCount; i++) {
        hashEnd = this._hash(hashEnd);
    }
    if (!this._myHashes) { this._myHashes = []; }
    this._myHashes.push(hashInfo);
    return hashEnd;
}

TlhtAlgo.prototype.isHashReady = function () {
    return this._myHashes.length > 0 && this._myHashes.length > 0;
}

TlhtAlgo.prototype.createMessage = function (raw) {
    var hx = new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    return this._encrypt(hx.concat(raw));
}

TlhtAlgo.prototype.processMessage = function (bytes) {
    var decryptedData = this._decrypt(bytes);
    return decryptedData.bitSlice(128, decryptedData.bitLength());
}

TlhtAlgo.prototype.setHashEnd = function (hashEnd) {
    if (!this._herHashes) { this._herHashes = []; }
    this._herHashes.push({
        end: hashEnd
    });
}





TlhtAlgo.prototype.deserialize = function (data) {
    this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
    this._hashStart = data.hashStart ? Hex.deserialize(data.hashStart) : null;
    this._hashEnd = data.hashEnd ? Hex.deserialize(data.hashEnd) : null;
    this._hashCounter = data.hashCounter;

}

TlhtAlgo.prototype.serialize = function () {
    return {
        dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null,
        hashStart: this._hashStart ? this._hashStart.as(Hex).serialize() : null,
        hashEnd: this._hashEnd ? this._hashEnd.as(Hex).serialize() : null,
        hashCounter: this._hashCounter
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