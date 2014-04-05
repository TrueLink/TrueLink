define([
    "zepto",
    "modules/channels/messagingChannel",
    "modules/channels/tokens",
    "modules/cryptography/aes-sjcl",
    "modules/channels/tlkeChannel",
    "modules/data-types/bitArray",
    "modules/data-types/utf8string",
    "modules/data-types/hex",
    "modules/data-types/bytes",
    "modules/cryptography/sha1-crypto-js"
], function ($, MessagingChannel, tokens, Aes, TlkeChannel, BitArray, Utf8String, Hex, Bytes, SHA1) {
    "use strict";

    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    // tl channel that is established and ready to transmit POJOs
    function TlChannel() {}

    TlChannel.prototype = new MessagingChannel();
    $.extend(TlChannel.prototype, {

        // token received from user
        enterToken: function (token, context) {
            if (token instanceof tokens.TlChannel.InitToken) {
                //this._setupChannel(token.key);
                //this.dhAesKey = key;
                //this._notifyDirty();
            }
        },

        // user submits message to send, message must be plain object for now (kind of serializable in future)
        sendMessage: function (message) {
            invariant($.isPlainObject(message), "message must be a plain object");
            invariant(this.hashCounter, "This channel is expired");

            var hx = this.hashStart, i;
            for (i = 0; i < this.hashCounter; i += 1) {
                hx = hash(hx);
            }
            this.hashCounter -= 1;
            if (this.hashCounter === TlChannel.HashExperiesCount) {
                this._emitPrompt(new tokens.TlChannel.ExpiresToken());
            }
            if (this.hashCounter < 1) {
                this._emitPrompt(new tokens.TlChannel.ExpiredToken());
            }
            this._notifyDirty();

            var raw = new Utf8String(JSON.stringify(message.serialize()));
            var encrypted = this._encrypt(hx.as(Bytes).concat(raw));
            this._sendPacket(encrypted);
        },

        // process packet from the network
        processPacket: function (bytes) {
            var decryptedData = this._decrypt(bytes);
            var hx = decryptedData.bitSlice(0, 128);
            var netData = decryptedData.bitSlice(128, decryptedData.bitLength());
            var messageData;
            try {
                messageData = JSON.parse(netData.as(Utf8String).value);
            } catch (ex) {
                throw new Error("Could not parse packet from the network");
            }

            // check hash
            // this._emitMessage
//      console.error("Received a user message with wrong signature, rejected");
//      this._emitPrompt(new tokens.TlChannel.WrongSignatureToken(message.data));

        },

        //_isHashValid: function (hx) {
        //    // TODO ACHTUNG will accept any message if no hashtail set yet!
        //    if (!this.backHashEnd) {
        //        console.warn("this channel did not receive any hashtail yet");
        //        return null;
        //    }
//
        //    var end = this.backHashEnd.as(Hex).value, i;
        //    for (i = 0; i < TlChannel.HashCount; i += 1) {
        //        hx = hash(hx);
        //        if (hx.as(Hex).value === end) {
        //            return true;
        //        }
        //    }
        //    return false;
        //},

        _encrypt: function (bytes, customKey) {
            var iv = this.random.bitArray(128);
            var aes = new Aes(customKey || this.dhAesKey);
            var encryptedData = aes.encryptCbc(bytes, iv);
            return iv.as(Bytes).concat(encryptedData);
        },

        _decrypt: function (bytes, customKey) {
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
        }
    });

    TlChannel.deserialize = function (dto) {
        var ch = new TlChannel();
        ch.hashStart = dto.hashStart ? Hex.deserialize(dto.hashStart) : null;
        ch.hashCounter = dto.hashCounter;
        ch.dhAesKey = dto.dhAesKey ? Hex.deserialize(dto.dhAesKey) : null;
        ch.backHashEnd = dto.backHashEnd ? Hex.deserialize(dto.backHashEnd) : null;
        return ch;
    };


    return TlChannel;
});