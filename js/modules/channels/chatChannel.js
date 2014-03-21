define(["modules/channels/channel",
    "zepto",
    "modules/cryptography/aes-sjcl",
    "modules/channels/establishChannel",
    "modules/data-types/bitArray",
    "modules/data-types/utf8string",
    "modules/data-types/hex",
    "modules/data-types/bytes",
    "modules/cryptography/sha1-crypto-js"
    ], function (Channel, $, Aes, EstablishChannel, BitArray, Utf8String, Hex, Bytes, SHA1) {
    "use strict";

    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    function ChatChannel() {}

    ChatChannel.prototype = new Channel();
    $.extend(ChatChannel.prototype, {

        enterToken: function (token, context) {
            if (token instanceof EstablishChannel.NewChannelToken) {
                this._setupChannel(token.inId, token.outId, token.key);
            }
        },


        onUserMessage: function (hash, netMsg) {
            if (this.isHashValid(hash)) {
                this._emitUserMessage(netMsg.c);
            } else {
                console.error("Received a user message with wrong signature, rejected");
                this._emitPrompt(new ChatChannel.WrongSignatureToken(netMsg.c));
            }
        },
        onHashMessage: function (hash, netMsg) {
            console.info("receiving hashtail", netMsg.ht);
            if (this.isHashValid(hash) !== false && netMsg.ht) {
                console.log("Received hashtail " + netMsg.ht);
                this.backHashEnd = new Hex(netMsg.ht);
                this._notifyDirty();
            } else {
                console.error("Received a new hashtail with wrong signature, rejected");
            }
        },
        onUnknownMessage: function (hash, netMsg) {
            console.warn("Received message of unknown type " + netMsg.t + ": ", netMsg);
        },

        // null if has not received the hashtail yet
        isHashValid: function (hx) {
            // TODO ACHTUNG will accept any message if no hashtail set yet!
            if (!this.backHashEnd) {
                console.warn("this channel did not receive any hashtail yet");
                return null;
            }

            var end = this.backHashEnd.as(Hex).value, i;
            for (i = 0; i < ChatChannel.HashCount; i += 1) {
                hx = hash(hx);
                if (hx.as(Hex).value === end) {
                    return true;
                }
            }
            return false;
        },

        _generateHashTail: function () {
            this.hashStart = this.random.bitArray(128);
            this.hashCounter = ChatChannel.HashCount;
            this._notifyDirty();
        },

        _sendHashTail: function () {
            var hashEnd = this.hashStart, i;
            for (i = 0; i < ChatChannel.HashCount; i += 1) {
                hashEnd = hash(hashEnd);
            }
            var netMessage = {
                t: ChatChannel.MSG_TYPE_HASH,
                ht: hashEnd.as(Hex).value
            };
            console.info("sending hashtail", hashEnd.as(Hex).value);
            this._sendMessage(netMessage);
        },

        sendMessage: function (message) {
            var netMessage = {
                t: ChatChannel.MSG_TYPE_USER,
                c: message
            };
            this._sendMessage(netMessage);
        },

        _sendMessage: function (netMessage) {

            var hx = this.hashStart, i;
            for (i = 0; i < this.hashCounter; i += 1) {
                hx = hash(hx);
            }
            this.hashCounter -= 1;
            this._notifyDirty();

            var raw = new Utf8String(JSON.stringify(netMessage));
            var encrypted = this._encrypt(hx.as(Bytes).concat(raw));
            this._sendPacket(encrypted);
        },

        processPacket: function (bytes) {
            var decryptedData = this._decrypt(bytes);
            var hx = decryptedData.bitSlice(0, 128);
            var netData = decryptedData.bitSlice(128, decryptedData.bitLength());
            var netMessage;
            try {
                netMessage = JSON.parse(netData.as(Utf8String).value);
            } catch (ex) {
                throw new Error("Could not parse the network message");
            }
            switch (netMessage.t) {
            case ChatChannel.MSG_TYPE_USER:
                this.onUserMessage(hx, netMessage);
                break;
            case ChatChannel.MSG_TYPE_HASH:
                this.onHashMessage(hx, netMessage);
                break;
            default:
                this.onUnknownMessage(hx, netMessage);
                break;
            }
        },
        serialize: function () { throw new Error("Not implemented"); },

        _setupChannel: function (inId, outId, key) {
            this.dhAesKey = key;
            this.inChannelName = inId;
            this.outChannelName = outId;
            this._notifyDirty();
            this._notifyChannel({inId: this.inChannelName, outId: this.outChannelName});
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
        }


    });

    ChatChannel.MSG_TYPE_USER = "c";
    ChatChannel.MSG_TYPE_HASH = "h";
    ChatChannel.HashCount = 1000;
    ChatChannel.WrongSignatureToken = function (msg) { this.msg = msg; };

    ChatChannel.deserialize = function (dto) {
        throw new Error("Not implemented");
        var deserialized = new ChatChannel();
        [].forEach(function (key) {
            this[key] = dto.getData(key);
        });
        return deserialized;
    };

    return ChatChannel;
});