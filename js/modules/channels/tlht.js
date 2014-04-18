define([
    "zepto",
    "modules/channels/EventEmitter",
    "modules/cryptography/aes-sjcl",
    "modules/channels/tlec",
    "modules/data-types/bitArray",
    "modules/data-types/utf8string",
    "modules/data-types/hex",
    "modules/data-types/bytes",
    "modules/data-types/isMultivalue",
    "modules/cryptography/sha1-crypto-js",
    "tools/invariant"
], function ($, EventEmitter, Aes, TlChannel, BitArray, Utf8String, Hex, Bytes, isMultivalue, SHA1, invariant) {
    "use strict";

    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    function Tlht() {
        this._defineEvent("htReady");
        this._defineEvent("packet");
        this._defineEvent("dirty");
    }

    Tlht.prototype = new EventEmitter();
    $.extend(Tlht.prototype, {
        init: function (key) {
            invariant(isMultivalue(key), "key must be multivalue");
            invariant(this.random, "rng is not set");
            this.checkEventHandlers();
            this.dhAesKey = key;
            this._onDirty();
        },

        generate: function () {
            this.hashStart = this.random.bitArray(128);
            var hashEnd = this.hashStart, i;
            for (i = 0; i < TlChannel.HashCount; i += 1) {
                hashEnd = hash(hashEnd);
            }

            var messageData = {
                "t": "h",
                "d": hashEnd.as(Hex).serialize()
            };
            this._sendMessage(messageData);
            if (this.hashEnd) {
                this._onHashReady();
            }
            this._onDirty();
        },

        _sendMessage: function (messageData) {
            var raw = new Utf8String(JSON.stringify(messageData));
            var hx = new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            var encrypted = this._encrypt(hx.concat(raw));
            this.fire("packet", encrypted);
        },

        // process packet from the network
        processPacket: function (bytes) {
            invariant(bytes && $.isFunction(bytes.as), "bytes must be multivalue");
            var decryptedData = this._decrypt(bytes);
            var netData = decryptedData.bitSlice(128, decryptedData.bitLength());
            var message;
            try {
                message = JSON.parse(netData.as(Utf8String).value);
            } catch (ex) {
                throw new Error("Could not parse packet from the network");
            }
            if (message.t === "h" && message.d) {
                this.hashEnd = Hex.deserialize(message.d);
                if (this.hashStart) {
                    this._onHashReady();
                }
            }
        },

        _encrypt: function (bytes) {
            invariant(this.dhAesKey, "channel is not configured");
            var iv = this.random.bitArray(128);
            var aes = new Aes(this.dhAesKey);
            var encryptedData = aes.encryptCbc(bytes, iv);
            return iv.as(Bytes).concat(encryptedData);
        },

        _decrypt: function (bytes) {
            invariant(this.dhAesKey, "channel is not configured");
            var dataBitArray = bytes.as(BitArray);
            var iv = dataBitArray.bitSlice(0, 128);
            var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
            var aes = new Aes(this.dhAesKey);
            return aes.decryptCbc(encryptedData, iv);
        },

        _onHashReady: function () {
            this.fire("htReady", {
                hashStart: this.hashStart,
                hashEnd: this.hashEnd
            });
        },
        _onDirty: function () {
            this.fire("dirty");
        },

        _getRandomBytes: function (bitLength) {
            invariant(this.random, "No valid rng is set");
            return this.random.bitArray(bitLength);
        },
        // IRng: multivalue bitArray(bitLength)
        setRng: function (rng) {
            invariant(rng && $.isFunction(rng.bitArray), "rng is not implementing IRng");
            this.random = rng;
        }

    });

    return Tlht;
});