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
    "modules/cryptography/sha1-crypto-js"
    ], function ($, Channel, tokens, Aes, TlkeChannel, BitArray, Utf8String, Hex, Bytes, SHA1) {
    "use strict";

    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    // tl channel that is established and ready to transmit POJOs
    function GenericChannel() {}

    GenericChannel.prototype = new Channel();
    $.extend(GenericChannel.prototype, {

        // user submits message to send, message should be plain object for now (kind of serializable in future)
        sendMessage: function (message) {
            if (!$.isPlainObject(message)) {
                throw new Error("Argument exception. message should be the plain object");
            }
            this._sendMessage(new GenericChannelMessage(GenericChannelMessage.MSG_TYPE_USER, message));
        },
        // set user message receiver
        setMsgProcessor: function (iMsgProcessor) { this.msgProcessor = iMsgProcessor; },

        // emit user message to this.msgProcessor
        _emitUserMessage: function (message) {
            this._check("msgProcessor");
            this.msgProcessor.processMessage(this, message);
        },

        // token received from user
        enterToken: function (token, context) {
            if (token instanceof tokens.TlkeChannel.GenericChannelGeneratedToken) {
                this._setupChannel(token.key);
            }
        },

        // user message container received from network
        onUserMessage: function (hash, message) {
            if (this._isHashValid(hash)) {
                this._emitUserMessage(message.data);
            } else {
                console.error("Received a user message with wrong signature, rejected");
                this._emitPrompt(new tokens.GenericChannel.WrongSignatureToken(message.data));
            }
        },

        // hashtail message container received from network
        // TODO changing hashTail anytime is still possible
        onHashMessage: function (hash, message) {
            if (this._isHashValid(hash) !== false && message.hashTail) {
                console.log("Received hashtail " + message.hashTail.toString());
                this.backHashEnd = message.hashTail;
                this._notifyDirty();
            } else {
                console.error("Received a new hashtail with wrong signature, rejected");
            }
        },

        // wtf received from network
        onUnknownMessage: function (hash, rawData) {
            console.warn("Received message of unknown type: ", rawData);
        },

        // null if has not received the hashtail yet
        _isHashValid: function (hx) {
            // TODO ACHTUNG will accept any message if no hashtail set yet!
            if (!this.backHashEnd) {
                console.warn("this channel did not receive any hashtail yet");
                return null;
            }

            var end = this.backHashEnd.as(Hex).value, i;
            for (i = 0; i < GenericChannel.HashCount; i += 1) {
                hx = hash(hx);
                if (hx.as(Hex).value === end) {
                    return true;
                }
            }
            return false;
        },

        _generateHashTail: function () {
            this.hashStart = this.random.bitArray(128);
            this.hashCounter = GenericChannel.HashCount;
            this._notifyDirty();
        },

        _sendHashTail: function () {
            var hashEnd = this.hashStart, i;
            for (i = 0; i < GenericChannel.HashCount; i += 1) {
                hashEnd = hash(hashEnd);
            }
            console.info("sending hashtail", hashEnd.as(Hex).toString());
            this._sendMessage(new GenericChannelMessage(GenericChannelMessage.MSG_TYPE_HASH, null, hashEnd));
        },

        _sendMessage: function (message) {
            if (!this.hashCounter) {
                throw new Error("This channel is expired");
            }
            var hx = this.hashStart, i;
            for (i = 0; i < this.hashCounter; i += 1) {
                hx = hash(hx);
            }
            this.hashCounter -= 1;
            if (this.hashCounter === GenericChannel.HashExperiesCount) {
                this._emitPrompt(new tokens.GenericChannel.ExpiresToken());
            }
            if (this.hashCounter < 1) {
                this._emitPrompt(new tokens.GenericChannel.ExpiredToken());
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
            var message, rawData;
            try {
                rawData = JSON.parse(netData.as(Utf8String).value);
                message = GenericChannelMessage.deserialize(rawData);
            } catch (ex) {
                throw new Error("Could not parse packet from the network");
            }

            switch (message.type) {
            case GenericChannelMessage.MSG_TYPE_USER:
                this.onUserMessage(hx, message);
                break;
            case GenericChannelMessage.MSG_TYPE_HASH:
                this.onHashMessage(hx, message);
                break;
            default:
                this.onUnknownMessage(rawData);
                break;
            }
        },

        _setupChannel: function (key) {
            this.dhAesKey = key;
            this._notifyDirty();
            this._generateHashTail();
            this._sendHashTail();
        },

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

    GenericChannel.deserialize = function (dto) {
        var ch = new GenericChannel();
        ch.hashStart = dto.hashStart ? Hex.deserialize(dto.hashStart) : null;
        ch.hashCounter = dto.hashCounter;
        ch.dhAesKey = dto.dhAesKey ? Hex.deserialize(dto.dhAesKey) : null;
        ch.backHashEnd = dto.backHashEnd ? Hex.deserialize(dto.backHashEnd) : null;
        return ch;
    };

    function GenericChannelMessage(type, data, hashTail) {
        this.type = type;
        if (data) {
            this.data = data;
        }
        if (hashTail) {
            this.hashTail = hashTail;
        }
    }
    // serialize message to a plain object
    GenericChannelMessage.prototype.serialize = function () {
        var dto = {
            t: this.type
        };
        // TODO legacy support. we can replace this with another wrapper like ChannelGroupMessage
        if (this.data) {
            dto.c = this.data;
        }
        if (this.hashTail) {
            dto.ht = this.hashTail.as(Hex).serialize();
        }
        return dto;
    };
    // serialize message from a plain object
    GenericChannelMessage.deserialize = function (dto) {
        var data = dto.c || null;
        var hashTail = dto.ht ? Hex.deserialize(dto.ht) : null;
        return new GenericChannelMessage(dto.t, data, hashTail);
    };

    GenericChannelMessage.MSG_TYPE_USER = "c";
    GenericChannelMessage.MSG_TYPE_HASH = "h";

    GenericChannel.HashCount = 1000;
    GenericChannel.HashExperiesCount = 10;



    return GenericChannel;
});