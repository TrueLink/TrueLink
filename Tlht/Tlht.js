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

    function Tlht(factory) {
        invariant(factory, "Can be constructed only with factory");
        invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

        this._factory = factory;
        this._defineEvent("changed");
        this._defineEvent("packet");
        this._defineEvent("htReady");

        this._dhAesKey = null;
        this._hashStart = null;
        this._readyCalled = false;
        this._random = factory.createRandom();
    }

    extend(Tlht.prototype, eventEmitter, serializable, {
        serialize: function (packet, context) {
            packet.setData({
                dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null,
                hashStart: this._hashStart ? this._hashStart.as(Hex).serialize() : null,
                readyCalled: this._readyCalled
            });
        },
        deserialize: function (packet, context) {
            var factory = this._factory;
            var data = packet.getData();
        },

        init: function (key) {
            invariant(key instanceof Multivalue, "key must be multivalue");
            invariant(this._random, "rng is not set");
            this.checkEventHandlers();
            this._dhAesKey = key;
            this._onChanged();
        },

        generate: function () {
            console.log("Tlht generate");
            this._hashStart = this._random.bitArray(128);
            var hashEnd = this._hashStart, i;
            for (i = 0; i < Tlec.HashCount; i += 1) {
                hashEnd = hash(hashEnd);
            }

            var messageData = {
                "t": "h",
                "d": hashEnd.as(Hex).serialize()
            };
            this._onMessage(messageData);
            if (this.hashEnd) {
                this._onHashReady();
            }
            this._onChanged();
            
        },

        _onMessage: function (messageData) {
            var raw = new Utf8String(JSON.stringify(messageData));
            var hx = new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            var encrypted = this._encrypt(hx.concat(raw));
            this.fire("packet", encrypted);
        },

        // process packet from the network
        processPacket: function (bytes) {
            invariant(bytes instanceof Multivalue, "bytes must be multivalue");
            var decryptedData = this._decrypt(bytes);
            var netData = decryptedData.bitSlice(128, decryptedData.bitLength());
            var message;
            try {
                message = JSON.parse(netData.as(Utf8String).value);
            } catch (ex) {
                console.log("Tlht failed to parse message");
                // not for me
                return;
            }
            if (message.t === "h" && message.d) {
                this.hashEnd = Hex.deserialize(message.d);
                if (this._hashStart) {
                    console.log("hashes ready");
                    this._onHashReady();
                }
            }else {
                console.log("Tlht process packet, skiping some msg", message);
            }
        },

        _encrypt: function (bytes) {
            invariant(this._dhAesKey, "channel is not configured");
            var iv = this._random.bitArray(128);
            var aes = new Aes(this._dhAesKey);
            var encryptedData = aes.encryptCbc(bytes, iv);
            return iv.as(Bytes).concat(encryptedData);
        },

        _decrypt: function (bytes) {
            invariant(this._dhAesKey, "channel is not configured");
            var dataBitArray = bytes.as(BitArray);
            var iv = dataBitArray.bitSlice(0, 128);
            var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
            var aes = new Aes(this._dhAesKey);
            return aes.decryptCbc(encryptedData, iv);
        },

        _onHashReady: function () {
            if (this._readyCalled) { return; }
            this._readyCalled = true;
            this.fire("htReady", {
                hashStart: this._hashStart,
                hashEnd: this.hashEnd
            });
            this._onChanged();
        },

        _onChanged: function () {
            this.fire("changed", this);
        },

        _getRandomBytes: function (bitLength) {
            invariant(isFunction(this._random.bitArray), "random must implement IRandom");
            return this._random.bitArray(bitLength);
        }


    });

    module.exports = Tlht;
});