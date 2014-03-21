define(["modules/channels/channel",
    "zepto",
    "modules/cryptography/aes-sjcl",
    "modules/channels/establishChannel"
], function (Channel, $, Aes, EstablishChannel) {
    "use strict";


    function ChatChannel() {}

    ChatChannel.prototype = new Channel();
    $.extend(ChatChannel.prototype, {
        enterToken: function (token, context) {
            if (token instanceof EstablishChannel.NewChannelToken) {
                this._setupChannel(token.inId, token.outId, token.key);
            }
        },
        processPacket: function (bytes) {

        },
        serialize: function () { throw new Error("Not implemented"); },

        _setupChannel: function (inId, outId, key) {
            this.dhAesKey = key;
            this.inChannelName = inId;
            this.outChannelName = outId;
            this._notifyChannel({inId: this.inChannelName, outId: this.outChannelName});
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

    ChatChannel.deserialize = function (dto) {
        var deserialized = new ChatChannel();
        [].forEach(function (key) {
            this[key] = dto.getData(key);
        });
        return deserialized;
    };

    return ChatChannel;
});