"use strict";

var SHA1 = require("../modules/cryptography/sha1-crypto-js");
var Hex = require("../modules/multivalue/hex");
var BitArray = require("../modules/multivalue/bitArray");
var Bytes = require("../modules/multivalue/bytes");
var Aes = require("../modules/cryptography/aes-sjcl");

var invariant = require("../modules/invariant");
var Multivalue = require("../modules/multivalue/multivalue");
var Tlec = require("./../Tlec/Tlec");





// __________________________________________________________________________ //

function DecryptionFailedError(innerError) {
    this.innerError = innerError;
}

// __________________________________________________________________________ //

function TlhtAlgo(random) {
    this._random = random;

    this._dhAesKey = null;
    this._hashStart = null;
    this._hashEnd = null;
}

TlhtAlgo.prototype.init = function (key) {
    invariant(this._random, "rng is not set");
    this._dhAesKey = key;
}

TlhtAlgo.prototype.generate = function () {
    this._hashStart = this._random.bitArray(128);
    var hashEnd = this._hashStart, i;
    for (i = 0; i < Tlec.HashCount; i += 1) {
        hashEnd = this._hash(hashEnd);
    }
    return hashEnd;
}

TlhtAlgo.prototype.isHashReady = function () {
    return !!this._hashStart && !!this._hashEnd;
}

TlhtAlgo.prototype.getHashReady = function () {
    return { 
        hashStart: this._hashStart,
        hashEnd: this._hashEnd
    };
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
    this._hashEnd = hashEnd;
}

TlhtAlgo.prototype.deserialize = function (data) {
    this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
    this._hashStart = data.hashStart ? Hex.deserialize(data.hashStart) : null;
    this._hashEnd = data.hashEnd ? Hex.deserialize(data.hashEnd) : null;
}

TlhtAlgo.prototype.serialize = function () {
    return {
        dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null,
        hashStart: this._hashStart ? this._hashStart.as(Hex).serialize() : null,
        hashEnd: this._hashEnd ? this._hashEnd.as(Hex).serialize() : null
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