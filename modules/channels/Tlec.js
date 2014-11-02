"use strict";
var tools = require("../tools");
var SHA1 = require("../cryptography/sha1-crypto-js");
var Hex = require("../multivalue/hex");
var BitArray = require("../multivalue/bitArray");
var Bytes = require("../multivalue/bytes");
var Aes = require("../cryptography/aes-sjcl");

var eventEmitter = require("../events/eventEmitter");
var invariant = require("../invariant");
var Multivalue = require("../multivalue/multivalue");

var serializable = require("../serialization/serializable");

var extend = tools.extend;
var isFunction = tools.isFunction;

Tlec.HashCount = 1000;

function hash(value) {
    return SHA1(value).as(BitArray).bitSlice(0, 128);
}

function Tlec(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

    this._defineEvent("expired");
    this._defineEvent("packet");
    this._defineEvent("message");
    this._defineEvent("wrongSignatureMessage");
    this._defineEvent("changed");

    this._factory = factory;
    this._random = factory.createRandom();
    this._backHashEnd = null;
    this._hashStart = null;
    this._dhAesKey = null;
    this._hashCounter = null;
}

extend(Tlec.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {

        packet.setData({
            hashStart: this._hashStart ? this._hashStart.as(Hex).serialize() : null,
            hashCounter: this._hashCounter,
            dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null,
            backHashEnd: this._backHashEnd ? this._backHashEnd.as(Hex).serialize() : null
        });
    },
    deserialize: function (packet, context) {
        var factory = this._factory;
        var data = packet.getData();

        this._hashStart = data.hashStart ? Hex.deserialize(data.hashStart) : null;
        this._hashCounter = data.hashCounter;
        this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
        this._backHashEnd = data.backHashEnd ? Hex.deserialize(data.backHashEnd) : null;
    },

    init: function (initObj) {
        var message = "initObj mus be {key: multivalue, hashStart: multivalue, hashEnd: multivalue}";
        invariant(initObj, message);
        invariant(initObj.key instanceof Multivalue, message);
        invariant(initObj.hashStart instanceof Multivalue, message);
        invariant(initObj.hashEnd instanceof Multivalue, message);

        this._backHashEnd = initObj.hashEnd;
        this._hashStart = initObj.hashStart;
        this._dhAesKey = initObj.key;
        this._hashCounter = Tlec.HashCount - 1;
        this.checkEventHandlers();
        this._onChanged();
    },

    sendMessage: function (message) {
        invariant(message instanceof Multivalue, "message must be multivalue");
        invariant(this._hashStart, "channel is not configured");
        invariant(this._hashCounter && this._hashCounter > 1, "This channel is expired");

        var hx = this._hashStart, i;
        for (i = 0; i < this._hashCounter; i += 1) {
            hx = hash(hx);
        }
        this._hashCounter -= 1;
        if (this._hashCounter <= 1) {
            this.fire("expired");
        }
        this._onChanged();

//            var raw = new Utf8String(JSON.stringify(message));
        var encrypted = this._encrypt(hx.as(Bytes).concat(message));
        this.fire("packet", encrypted);
    },

    // process packet from the network
    processPacket: function (bytes) {
        var decryptedData = this._decrypt(bytes);
        var hx = decryptedData.bitSlice(0, 128);
        var netData = decryptedData.bitSlice(128, decryptedData.bitLength());

        if (!this._isHashValid(hx)) {
            this.fire("wrongSignatureMessage", netData);
            return;
        }
        this.fire("message", netData);
    },

    _isHashValid: function (hx) {
        invariant(this._backHashEnd, "channel is not configured");

        var end = this._backHashEnd.as(Hex).value, i;
        for (i = 0; i < Tlec.HashCount; i += 1) {
            hx = hash(hx);
            if (hx.as(Hex).value === end) {
                return true;
            }
        }
        return false;
    },

    _encrypt: function (bytes, customKey) {
        invariant(this._dhAesKey, "channel is not configured");
        var iv = this._getRandomBytes(128);
        var aes = new Aes(customKey || this._dhAesKey);
        var encryptedData = aes.encryptCbc(bytes, iv);
        return iv.as(Bytes).concat(encryptedData);
    },

    _decrypt: function (bytes, customKey) {
        invariant(this._dhAesKey, "channel is not configured");

        var dataBitArray = bytes.as(BitArray);
        var iv = dataBitArray.bitSlice(0, 128);
        var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
        var aes = new Aes(customKey || this._dhAesKey);
        return aes.decryptCbc(encryptedData, iv);
    },

    _onChanged: function () {
        this.fire("changed", this);
    },

    _getRandomBytes: function (bitLength) {
        invariant(isFunction(this._random.bitArray), "random must implement IRandom");
        return this._random.bitArray(bitLength);
    }
});

module.exports = Tlec;
