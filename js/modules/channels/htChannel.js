define([
    "zepto",
    "modules/channels/channel",
    "modules/channels/tokens",
    "modules/cryptography/aes-sjcl",
    "modules/channels/tlChannel",
    "modules/data-types/bitArray",
    "modules/data-types/utf8string",
    "modules/data-types/hex",
    "modules/data-types/bytes",
    "modules/cryptography/sha1-crypto-js",
    "tools/invariant"
], function ($, Channel, tokens, Aes, TlChannel, BitArray, Utf8String, Hex, Bytes, SHA1, invariant) {
    "use strict";

    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    function HtChannel() {}

    HtChannel.prototype = new Channel();
    $.extend(HtChannel.prototype, {
        enterToken: function (token, context) {
            if (token instanceof tokens.HtChannel.InitToken) {
                this._setupChannel(token);
            } else if (token instanceof tokens.HtChannel.HtToken) {
                this._emitTlSetupToken(token.ht);
            }
        },

        _emitTlSetupToken: function (hashtail) {
            invariant(hashtail && $.isFunction(hashtail.as), "hashtail must be multivalue");
            invariant(this.dhAesKey && this.inId && this.outId && this.hashStart, "channel is not configured");
            this._emitPrompt(tokens.TlChannel.InitToken(this.inId, this.outId, this.dhAesKey, this.hashStart, hashtail));
        },

        _setupChannel: function (token) {
            invariant(this.random, "rng is not set");

            invariant(token.key && $.isFunction(token.key.as), "token.key must be multivalue");
            this.dhAesKey = token.key;
            invariant(token.inId && $.isFunction(token.inId.as), "token.inId must be multivalue");
            this.inId = token.inId;
            invariant(token.outId && $.isFunction(token.outId.as), "token.outId must be multivalue");
            this.outId = token.outId;
            this.hashStart = this.random.bitArray(128);
            var hashEnd = this.hashStart, i;
            for (i = 0; i < TlChannel.HashCount; i += 1) {
                hashEnd = hash(hashEnd);
            }
            this._emitPrompt(new tokens.HtChannel.HtToken(hashEnd));
            this._notifyDirty();
        },

        _sendMessage: function (messageData) {
            invariant($.isPlainObject(messageData), "this channel can only send plain-object messages");
            var raw = new Utf8String(JSON.stringify(messageData));
            var hx = new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            var encrypted = this._encrypt(hx.concat(raw));
            this._sendPacket(encrypted);
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
            this._emitUserMessage(message);
        },

        // emit user message to this.msgProcessor
        _emitUserMessage: function (message) {
            this._check("msgProcessor");
            this.msgProcessor.processMessage(this, message);
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

    return HtChannel;
});