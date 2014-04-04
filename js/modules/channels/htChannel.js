define([
    "zepto",
    "modules/channels/channel",
    "modules/channels/tokens",
    "modules/cryptography/aes-sjcl",
    "modules/channels/tlkeChannel",
    "modules/data-types/bitArray",
    "modules/data-types/utf8string",
    "modules/data-types/hex",
    "modules/data-types/bytes",
    "modules/cryptography/sha1-crypto-js",
    "tools/invariant"
], function ($, Channel, tokens, Aes, TlkeChannel, BitArray, Utf8String, Hex, Bytes, SHA1, invariant) {
    "use strict";

    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    function HtChannel() {}

    HtChannel.prototype = new Channel();
    $.extend(HtChannel.prototype, {
        enterToken: function (token, context) {
            if (token instanceof tokens.HtChannel.InitToken) {
                this._setupChannel(token.key);
            }
        },

        onHashMessage: function (hash, message) {
            console.log("Received hashtail " + message.hashTail.toString());
            var backHashEnd = message.hashTail;
            invariant(this.hashStart && $.isFunction(this.hashStart.as), "hashStart is not ready yet");
            this._emitPrompt(new tokens.TlChannel.InitToken(this.inId, this.outId, this.dhAesKey, this.hashStart, backHashEnd));
        },

        _generateHashTail: function () {
            invariant(this.random, "rng is not set");
            this.hashStart = this.random.bitArray(128);
        },

        _sendHashTail: function () {
            invariant(this.hashStart, "hashStart is not generated");
            var hashEnd = this.hashStart, i;
            for (i = 0; i < HtChannel.HashCount; i += 1) {
                hashEnd = hash(hashEnd);
            }
            console.info("sending hashtail", hashEnd.as(Hex).toString());
            this._sendMessage(new TlChannelHashMessage(hashEnd));
        },

        _sendMessage: function (message) {
            var raw = new Utf8String(JSON.stringify(message.serialize()));
            var encrypted = this._encrypt(hx.as(Bytes).concat(raw));
            this._sendPacket(encrypted);
        },

        // process packet from the network
        processPacket: function (bytes) {
            invariant(bytes && $.isFunction(bytes.as), "bytes must be multivalue");
            var decryptedData = this._decrypt(bytes);
            var hx = decryptedData.bitSlice(0, 128);
            var netData = decryptedData.bitSlice(128, decryptedData.bitLength());
            var message, rawData;
            try {
                rawData = JSON.parse(netData.as(Utf8String).value);
                message = TlChannelHashMessage.deserialize(rawData);
            } catch (ex) {
                throw new Error("Could not parse packet from the network");
            }

            if (message.type === TlChannelHashMessage.MSG_TYPE_HASH) {
                this.onHashMessage(hx, message);
            }
        },

        _setupChannel: function (key) {
            invariant(key && $.isFunction(key.as), "key must be multivalue");
            this.dhAesKey = key;
            this._generateHashTail();
            this._sendHashTail();
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
        }

    });

    HtChannel.deserialize = function (dto) {
        throw new Error("not implemented");
    };

    function TlChannelHashMessage(hashTail) {
        invariant(hashTail && $.isFunction(hashTail.as), "hashTail must be multivalue");
        this.hashTail = hashTail;
    }
    // serialize message to a plain object
    TlChannelHashMessage.prototype.serialize = function () {
        return this.hashTail.as(Hex).serialize();
    };
    // serialize message from a plain object
    TlChannelHashMessage.deserialize = function (dto) {
        invariant(dto, "Nothing to deserialize");
        try {
            var hashTail = Hex.deserialize(dto);
            return new TlChannelHashMessage(hashTail);
        } catch (ex) {
            throw new Error("Could not deserialize message: " + ex.message);
        }
    };

    TlChannel.HashCount = 1000;


    return HtChannel;
});