"use strict";
var tools = require("modules/tools");
var SHA1 = require("modules/cryptography/sha1-crypto-js");
var Hex = require("Multivalue/multivalue/hex");
var BitArray = require("Multivalue/multivalue/bitArray");
var Bytes = require("Multivalue/multivalue/bytes");
var Aes = require("modules/cryptography/aes-sjcl");

var invariant = require("invariant");
var Multivalue = require("Multivalue").multivalue.Multivalue;

var DecryptionFailedError = require('./decryption-failed-error');

var isFunction = tools.isFunction;

function TlecAlgo(random) {
    this._random = random;
    this._dhAesKey = null;
}

TlecAlgo.prototype.init = function (initObj) {
    var message = "initObj mus be {key: multivalue}";
    invariant(initObj, message);
    invariant(initObj.key instanceof Multivalue, message);

    this._dhAesKey = initObj.key;
},

TlecAlgo.prototype.createMessage = function (bytes) {
    return this._encrypt(bytes);
}

// process packet from the network
TlecAlgo.prototype.processPacket = function (bytes) {
    return this._decrypt(bytes);
},

TlecAlgo.prototype.deserialize = function (data) {
    this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
}

TlecAlgo.prototype.serialize = function () {
    return {
        dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null
    };
}

TlecAlgo.prototype._encrypt = function (bytes, customKey) {
    invariant(this._dhAesKey, "channel is not configured");
    var iv = this._getRandomBytes(128);
    var aes = new Aes(customKey || this._dhAesKey);
    var encryptedData = aes.encryptCbc(bytes, iv);
    return iv.as(Bytes).concat(encryptedData);
}

TlecAlgo.prototype._decrypt = function (bytes, customKey) {
    invariant(this._dhAesKey, "channel is not configured");
    var dataBitArray = bytes.as(BitArray);
    var iv = dataBitArray.bitSlice(0, 128);
    var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
    var aes = new Aes(customKey || this._dhAesKey);
    try {
        return aes.decryptCbc(encryptedData, iv);
    }
    catch (ex) {
        throw new DecryptionFailedError(ex);
    }
}

TlecAlgo.prototype._getRandomBytes = function (bitLength) {
    invariant(isFunction(this._random.bitArray), "random must implement IRandom");
    return this._random.bitArray(bitLength);
}

module.exports = TlecAlgo;
