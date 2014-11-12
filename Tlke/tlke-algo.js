"use strict";

TlkeAlgo.authBitLength = 16;
TlkeAlgo.offerBitLength = 128;
TlkeAlgo.dhPrivBitLength = 160;

var tools = require("../modules/tools");
var SHA1 = require("../modules/cryptography/sha1-crypto-js");
var DiffieHellman = require("../modules/cryptography/diffie-hellman-leemon");
var Hex = require("../Multivalue/multivalue/hex");
var BitArray = require("../Multivalue/multivalue/bitArray");
var Bytes = require("../Multivalue/multivalue/bytes");
var Aes = require("../modules/cryptography/aes-sjcl");

var invariant = require("../modules/invariant");

var DecryptionFailedError = require('./decryption-failed-error');

var isFunction = tools.isFunction;


function TlkeAlgo(random) {
    this._random = random;

    this.dhAesKey = null;
    this._dhk = null;
    this._dh = null;
    this._auth = null;
    this._check = null;
    this._authData = null;
}

TlkeAlgo.prototype._getRandomBytes = function (bitLength) {
    invariant(isFunction(this._random.bitArray), "random must implement IRandom");
    return this._random.bitArray(bitLength);
}

TlkeAlgo.prototype._encrypt = function (bytes, customKey) {
    var iv = this._getRandomBytes(128);
    var aes = new Aes(customKey || this.dhAesKey);
    var encryptedData = aes.encryptCbc(bytes, iv);
    return iv.as(Bytes).concat(encryptedData);
}

TlkeAlgo.prototype._decrypt = function (bytes, customKey) {
    var dataBitArray = bytes.as(BitArray);
    var iv = dataBitArray.bitSlice(0, 128);
    var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
    var aes = new Aes(customKey || this.dhAesKey);
    try {
        return aes.decryptCbc(encryptedData, iv);
    }
    catch (ex) {
        throw new DecryptionFailedError(ex);
    }
}

TlkeAlgo.prototype._hash = function (value) {
    return SHA1(value).as(BitArray).bitSlice(0, 128);
}

// Alice 1.1 (instantiation)
TlkeAlgo.prototype.generateOffer = function () {
    this._dh = DiffieHellman.generate(TlkeAlgo.dhPrivBitLength, this._random);
    var dhAes = this._getRandomBytes(TlkeAlgo.offerBitLength);
    this.dhAesKey = dhAes;
    var outId = dhAes.bitSlice(0, 16);
    var inId = dhAes.bitSlice(16, 32);
    return {inId: inId, outId: outId};
}

// Bob 2.1 (instantiation) offer is from getOffer (via IM)
TlkeAlgo.prototype.acceptOffer = function (offer) {
    this._dh = DiffieHellman.generate(TlkeAlgo.dhPrivBitLength, this._random);
    var dhAes = offer.as(Hex).as(BitArray);
    this.dhAesKey = dhAes;
    var inId = dhAes.bitSlice(0, 16);
    var outId = dhAes.bitSlice(16, 32);
    return {inId: inId, outId: outId};
}


TlkeAlgo.prototype.getOfferData = function () {
    var dhData = new Hex(this._dh.createKeyExchange());
    return this._encrypt(dhData);
}

// Bob 2.2.
TlkeAlgo.prototype.acceptOfferData = function (bytes) {
    var dhData = this._decrypt(bytes);
    var dhDataHex = dhData.as(Hex).value;
    var dhkHex = this._dh.decryptKeyExchange(dhDataHex);
    this._dhk = new Hex(dhkHex);
}

TlkeAlgo.prototype.getOfferResponse = function () {
    var dhData = new Hex(this._dh.createKeyExchange());
    return this._encrypt(dhData);
}

// Alice 3.1
TlkeAlgo.prototype.acceptOfferResponse = function (data) {
    var dhDataHex = this._decrypt(data).as(Hex).value;
    var dhkHex = this._dh.decryptKeyExchange(dhDataHex);
    this._dhk = new Hex(dhkHex);

    this._auth = this._getRandomBytes(TlkeAlgo.authBitLength);
    this._check = this._getRandomBytes(128);
    return this._auth;
}

TlkeAlgo.prototype.getAuthData = function () {
    return this._encrypt(this._check, this._getVerifiedDhk());
}

TlkeAlgo.prototype._getVerifiedDhk = function () {
    var dhk = this._dhk.as(Bytes);
    var auth = this._auth.as(Bytes);
    return this._hash(dhk.concat(auth));
}

// Bob 4.2
TlkeAlgo.prototype.acceptAuthData = function (bytes) {
    this._authData = bytes;
}

// Bob 4.1
TlkeAlgo.prototype.acceptAuth = function (auth) {
    this._auth = auth;
}

TlkeAlgo.prototype.hasAuth = function () {        
    return !!this._auth;
}

TlkeAlgo.prototype.hasAuthData = function () {        
    return !!this._authData;
}

// Bob 4.3 (4.1 + 4.2)
TlkeAlgo.prototype.acceptAuthAndData = function () {
    var bytes = this._authData;
    // todo check's checksum and ACHTUNG if not match
    var verified = this._getVerifiedDhk();
    this._check = this._decrypt(bytes, verified);
    var hCheck = this._hash(this._check);
    return {
        inId: hCheck.bitSlice(0, 16),
        outId: hCheck.bitSlice(16, 32),
        key: this._hash(this._check.as(Bytes).concat(verified))
    };
}

TlkeAlgo.prototype.getAuthResponse = function () {
    var hCheck = this._hash(this._check);
    return this._encrypt(hCheck, this._getVerifiedDhk());
}

// Alice 5
TlkeAlgo.prototype.acceptAuthResponse = function (bytes) {
    var verified = this._getVerifiedDhk(),
        hCheck = this._decrypt(bytes, verified);
    if (this._hash(this._check).as(Hex).value !== hCheck.as(Hex).value) {
        return;
    }
    return {
        inId: hCheck.bitSlice(16, 32),
        outId: hCheck.bitSlice(0, 16),
        key: this._hash(this._check.as(Bytes).concat(verified))
    };
}

TlkeAlgo.prototype.deserialize = function (data) {
    this.dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
    this._dhk = data.dhk ? Hex.deserialize(data.dhk) : null;
    this._dh = data.dh ? DiffieHellman.deserialize(data.dh) : null;
    this._auth = data.auth ? Hex.deserialize(data.auth) : null;
    this._check = data.check ? Hex.deserialize(data.check) : null;
    this._authData = data.authData ? Hex.deserialize(data.authData) : null;
}

TlkeAlgo.prototype.serialize = function () {
    return {
        dhAesKey: this.dhAesKey ? this.dhAesKey.as(Hex).serialize() : null,
        dhk: this._dhk ? this._dhk.as(Hex).serialize() : null,
        dh: this._dh ? this._dh.serialize() : null,
        auth: this._auth ? this._auth.as(Hex).serialize() : null,
        check: this._check ? this._check.as(Hex).serialize() : null,
        authData: this._authData ? this._authData.as(Hex).serialize() : null
    };
}

module.exports = TlkeAlgo;