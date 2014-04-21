define([
    "zepto",
    "modules/channels/EventEmitter",
    "modules/cryptography/aes-sjcl",
    "modules/data-types/bitArray",
    "modules/data-types/utf8string",
    "modules/data-types/hex",
    "modules/data-types/bytes",
    "modules/data-types/isMultivalue",
    "tools/invariant",
    "modules/cryptography/sha1-crypto-js"
], function ($, EventEmitter, Aes, BitArray, Utf8String, Hex, Bytes, isMultivalue, invariant, SHA1) {
    "use strict";

    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    // tl channel that is established and ready to transmit POJOs
    function Tlec() {
        this._defineEvent("expired");
        this._defineEvent("packet");
        this._defineEvent("message");
        this._defineEvent("wrongSignatureMessage");
        this._defineEvent("dirty");
    }

    Tlec.HashCount = 1000;

    Tlec.prototype = new EventEmitter();
    $.extend(Tlec.prototype, {

        init: function (initObj) {
            var message = "initObj mus be {key: multivalue, hashStart: multivalue, hashEnd: multivalue}";
            invariant(initObj, message);
            invariant(isMultivalue(initObj.key), message);
            invariant(isMultivalue(initObj.hashStart), message);
            invariant(isMultivalue(initObj.hashEnd), message);
            invariant(this.random, "rng is not set");

            this.backHashEnd = initObj.hashEnd;
            this.hashStart = initObj.hashStart;
            this.dhAesKey = initObj.key;
            this.hashCounter = Tlec.HashCount - 1;
            this.checkEventHandlers();
            this._onDirty();
        },

        sendMessage: function (message) {
            invariant(isMultivalue(message), "message must be multivalue");
            invariant(this.hashStart, "channel is not configured");
            invariant(this.hashCounter && this.hashCounter > 1, "This channel is expired");

            var hx = this.hashStart, i;
            for (i = 0; i < this.hashCounter; i += 1) {
                hx = hash(hx);
            }
            this.hashCounter -= 1;
            if (this.hashCounter <= 1) {
                this.fire("expired");
            }
            this._onDirty();

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
            invariant(this.backHashEnd, "channel is not configured");

            var end = this.backHashEnd.as(Hex).value, i;
            for (i = 0; i < Tlec.HashCount; i += 1) {
                hx = hash(hx);
                if (hx.as(Hex).value === end) {
                    return true;
                }
            }
            return false;
        },

        _encrypt: function (bytes, customKey) {
            invariant(this.dhAesKey, "channel is not configured");
            var iv = this._getRandomBytes(128);
            var aes = new Aes(customKey || this.dhAesKey);
            var encryptedData = aes.encryptCbc(bytes, iv);
            return iv.as(Bytes).concat(encryptedData);
        },

        _decrypt: function (bytes, customKey) {
            invariant(this.dhAesKey, "channel is not configured");

            var dataBitArray = bytes.as(BitArray);
            var iv = dataBitArray.bitSlice(0, 128);
            var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
            var aes = new Aes(customKey || this.dhAesKey);
            return aes.decryptCbc(encryptedData, iv);
        },


        serialize: function () {
            return {
                hashStart: this.hashStart ? this.hashStart.as(Hex).serialize() : null,
                hashCounter: this.hashCounter,
                dhAesKey: this.dhAesKey ? this.dhAesKey.as(Hex).serialize() : null,
                backHashEnd: this.backHashEnd ? this.backHashEnd.as(Hex).serialize() : null
            };
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

    Tlec.deserialize = function (dto) {
        var ch = new Tlec();
        ch.hashStart = dto.hashStart ? Hex.deserialize(dto.hashStart) : null;
        ch.hashCounter = dto.hashCounter;
        ch.dhAesKey = dto.dhAesKey ? Hex.deserialize(dto.dhAesKey) : null;
        ch.backHashEnd = dto.backHashEnd ? Hex.deserialize(dto.backHashEnd) : null;
        return ch;
    };


    return Tlec;
});