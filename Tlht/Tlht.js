define(function (require, exports, module) {
    "use strict";

    var tools = require("../modules/tools");
    var SHA1 = require("../modules/cryptography/sha1-crypto-js");
    var Hex = require("../modules/multivalue/hex");
    var BitArray = require("../modules/multivalue/bitArray");
    var Utf8String = require("../modules/multivalue/utf8string");
    var Bytes = require("../modules/multivalue/bytes");
    var Aes = require("../modules/cryptography/aes-sjcl");

    var eventEmitter = require("../modules/events/eventEmitter");
    var invariant = require("../modules/invariant");
    var Multivalue = require("../modules/multivalue/multivalue");
    var Tlec = require("./../modules/channels/Tlec");

    var serializable = require("../modules/serialization/serializable");

    var extend = tools.extend;
    var isFunction = tools.isFunction;



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

        this._dhAesKey = null;
        this._hashStart = null;
        this._hashEnd = null;
    }

    Algo.prototype.init = function (key) {
        invariant(this._random, "rng is not set");
        this._dhAesKey = key;
    }

    Algo.prototype.generate = function () {
        this._hashStart = this._random.bitArray(128);
        var hashEnd = this._hashStart, i;
        for (i = 0; i < Tlec.HashCount; i += 1) {
            hashEnd = hash(hashEnd);
        }
        return hashEnd;
    }

    Algo.prototype.isHashReady = function () {
        return !!this._hashStart && !!this._hashEnd;
    }

    Algo.prototype.getHashReady = function () {
        return { 
            hashStart: this._hashStart,
            hashEnd: this._hashEnd
        };
    }

    Algo.prototype.createMessage = function (raw) {
        var hx = new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        return this._encrypt(hx.concat(raw));
    }

    Algo.prototype.processMessage = function (bytes) {
        var decryptedData = this._decrypt(bytes);
        return decryptedData.bitSlice(128, decryptedData.bitLength());
    }

    Algo.prototype.setHashEnd = function (hashEnd) {
        this._hashEnd = hashEnd;
    }

    Algo.prototype.deserialize = function (data) {
        this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
        this._hashStart = data.hashStart ? Hex.deserialize(data.hashStart) : null;
        this._hashEnd = data.hashEnd ? Hex.deserialize(data.hashEnd) : null;
    }

    Algo.prototype.serialize = function (packet, context) {
        return {
            dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null,
            hashStart: this._hashStart ? this._hashStart.as(Hex).serialize() : null,
            hashEnd: this._hashEnd ? this._hashEnd.as(Hex).serialize() : null
        };
    }

    Algo.prototype._encrypt = function (bytes) {
        invariant(this._dhAesKey, "channel is not configured");
        var iv = this._random.bitArray(128);
        var aes = new Aes(this._dhAesKey);
        var encryptedData = aes.encryptCbc(bytes, iv);
        return iv.as(Bytes).concat(encryptedData);
    }

    Algo.prototype._decrypt = function (bytes) {
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

// __________________________________________________________________________ //

    function Tlht(factory) {
        invariant(factory, "Can be constructed only with factory");
        invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

        this._factory = factory;
        this._defineEvent("changed");
        this._defineEvent("packet");
        this._defineEvent("htReady");

        this._readyCalled = false;
        this._algo = new Algo(factory.createRandom());
    }

    extend(Tlht.prototype, eventEmitter, serializable, {
        serialize: function (packet, context) {
            var data = this._algo.serialize();
            data.readyCalled = this._readyCalled;
            packet.setData(data);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this._readyCalled = dto.readyCalled;
            this._algo.deserialize(data);
        },

        init: function (key) {
            invariant(key instanceof Multivalue, "key must be multivalue");
            this._algo.init(key);
            this.checkEventHandlers();
            this._onChanged();
        },

        generate: function () {
            console.log("Tlht generate");
            var hashEnd = this._algo.generate();
            var messageData = {
                "t": "h",
                "d": hashEnd.as(Hex).serialize()
            };
            this._onMessage(messageData);
            if (this._algo.isHashReady()) {
                console.log("hashes ready");
                this._onHashReady();
            }
            this._onChanged();
        },

        _onMessage: function (messageData) {
            var raw = new Utf8String(JSON.stringify(messageData));
            var encrypted = this._algo.createMessage(raw);
            this.fire("packet", encrypted);
        },

        // process packet from the network
        processPacket: function (bytes) {
            invariant(bytes instanceof Multivalue, "bytes must be multivalue");

            var netData;
            try {
                netData = this._algo.processMessage(bytes);
            } catch (ex) {
                if (ex instanceof DecryptionFailedError) {
                    console.warn("Tlht failed to decrypt message. " + ex.innerError.message);
                    return; // not for me
                } else {
                    throw ex;
                }
            }

            var message;
            try {
                message = JSON.parse(netData.as(Utf8String).value);
            } catch (ex) {
                console.log("Tlht failed to parse message");
                // not for me
                return;
            }

            if (message.t === "h" && message.d) {
                this._algo.setHashEnd(Hex.deserialize(message.d));
                if (this._algo.isHashReady()) {
                    console.log("hashes ready");
                    this._onHashReady();
                }
            } else {
                console.log("Tlht process packet, skiping some msg", message);
            }
        },

        _onHashReady: function () {
            if (this._readyCalled) { return; }
            this._readyCalled = true;
            this.fire("htReady", this._algo.getHashReady());
            this._onChanged();
        },

        _onChanged: function () {
            this.fire("changed", this);
        }


    });

    module.exports = Tlht;
});