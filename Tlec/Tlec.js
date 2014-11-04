"use strict";
var tools = require("../modules/tools");
var SHA1 = require("../modules/cryptography/sha1-crypto-js");
var Hex = require("../modules/multivalue/hex");
var BitArray = require("../modules/multivalue/bitArray");
var Bytes = require("../modules/multivalue/bytes");
var Aes = require("../modules/cryptography/aes-sjcl");

var eventEmitter = require("../modules/events/eventEmitter");
var invariant = require("../modules/invariant");
var Multivalue = require("../modules/multivalue/multivalue");

var serializable = require("../modules/serialization/serializable");

var extend = tools.extend;
var isFunction = tools.isFunction;

Tlec.HashCount = Algo.HashCount = 1000;

function hash(value) {
    return SHA1(value).as(BitArray).bitSlice(0, 128);
}

// __________________________________________________________________________ //

function DecryptionFailedError(innerError) {
    this.innerError = innerError;
}

// __________________________________________________________________________ //

function Algo(random) {
    this._random = random;

    this._backHashEnd = null;
    this._hashStart = null;
    this._dhAesKey = null;
    this._hashCounter = null;
}

Algo.prototype.init = function (initObj) {
    var message = "initObj mus be {key: multivalue, hashStart: multivalue, hashEnd: multivalue}";
    invariant(initObj, message);
    invariant(initObj.key instanceof Multivalue, message);
    invariant(initObj.hashStart instanceof Multivalue, message);
    invariant(initObj.hashEnd instanceof Multivalue, message);

    this._backHashEnd = initObj.hashEnd;
    this._hashStart = initObj.hashStart;
    this._dhAesKey = initObj.key;
    this._hashCounter = Algo.HashCount - 1;
},

Algo.prototype._isHashValid = function (hx) {
    invariant(this._backHashEnd, "channel is not configured");

    var end = this._backHashEnd.as(Hex).value, i;
    for (i = 0; i < Algo.HashCount; i += 1) {
        hx = hash(hx);
        if (hx.as(Hex).value === end) {
            return true;
        }
    }
    return false;
}

Algo.prototype.createMessage = function (raw) {
    invariant(raw instanceof Multivalue, "raw must be multivalue");
    invariant(this._hashStart, "channel is not configured");
    invariant(this._hashCounter && this._hashCounter > 1, "This channel is expired");

    var hx = this._hashStart, i;
    for (i = 0; i < this._hashCounter; i += 1) {
        hx = hash(hx);
    }
    this._hashCounter -= 1;

    return this._encrypt(hx.as(Bytes).concat(raw));
}

Algo.prototype.isExpired = function () {
    return this._hashCounter <= 1;
}

// process packet from the network
Algo.prototype.processPacket = function (bytes) {
    var decryptedData = this._decrypt(bytes);
    var hx = decryptedData.bitSlice(0, 128);
    var netData = decryptedData.bitSlice(128, decryptedData.bitLength());

    if (!this._isHashValid(hx)) {
        return false;
    }
    return netData;
},

Algo.prototype.deserialize = function (data) {
    this._hashStart = data.hashStart ? Hex.deserialize(data.hashStart) : null;
    this._hashCounter = data.hashCounter;
    this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
    this._backHashEnd = data.backHashEnd ? Hex.deserialize(data.backHashEnd) : null;
}

Algo.prototype.serialize = function () {
    return {
        hashStart: this._hashStart ? this._hashStart.as(Hex).serialize() : null,
        hashCounter: this._hashCounter,
        dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null,
        backHashEnd: this._backHashEnd ? this._backHashEnd.as(Hex).serialize() : null
    };
}

Algo.prototype._encrypt = function (bytes, customKey) {
    invariant(this._dhAesKey, "channel is not configured");
    var iv = this._getRandomBytes(128);
    var aes = new Aes(customKey || this._dhAesKey);
    var encryptedData = aes.encryptCbc(bytes, iv);
    return iv.as(Bytes).concat(encryptedData);
}

Algo.prototype._decrypt = function (bytes, customKey) {
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

Algo.prototype._getRandomBytes = function (bitLength) {
    invariant(isFunction(this._random.bitArray), "random must implement IRandom");
    return this._random.bitArray(bitLength);
}

// __________________________________________________________________________ //

function Tlec(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

    this._defineEvent("expired");
    this._defineEvent("packet");
    this._defineEvent("message");
    this._defineEvent("wrongSignatureMessage");
    this._defineEvent("changed");

    this._factory = factory;
    this._algo = new Algo(factory.createRandom());
}

extend(Tlec.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {
        var data = this._algo.serialize();
        packet.setData(data);
    },
    deserialize: function (packet, context) {
        var data = packet.getData();
        this._algo.deserialize(data);
    },

    init: function (initObj) {
        this._algo.init(initObj);
        this.checkEventHandlers();
        this._onChanged();
    },

    sendMessage: function (message) {
        var encrypted = this._algo.createMessage(message);
        if (this._algo.isExpired()) {
            this.fire("expired");
        }
        this._onChanged();
        this.fire("packet", encrypted);
    },

    // process packet from the network
    processPacket: function (bytes) {
        var netData;
        try {
            netData = this._algo.processPacket(bytes);
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                throw DecryptionFailedError.innerError;
            } else {
                throw ex;
            }
        }

        if (netData === false) {
            this.fire("wrongSignatureMessage", netData);
            return;
        }
        this.fire("message", netData);
    },

    _onChanged: function () {
        this.fire("changed", this);
    },


});

module.exports = Tlec;
