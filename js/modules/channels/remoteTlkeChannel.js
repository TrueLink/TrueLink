define(["modules/channels/channel",
    "zepto",
    "modules/channels/tlkeChannel",
    "modules/data-types/hex",
    "modules/data-types/bitArray",
    "modules/data-types/bytes",
    "modules/cryptography/aes-sjcl",
    "modules/converters/customTypes"
], function (Channel, $, TlkeChannel, Hex, BitArray, Bytes, Aes) {
    "use strict";


    function RemoteTlkeChannel(genericChannel) {
        this.genericChannel = genericChannel;
    }

    RemoteTlkeChannel.prototype = new Channel();
    $.extend(RemoteTlkeChannel.prototype, {
        enterToken: function (token, context) {

        },
        processPacket: function (bytes) {

        },

        serialize: function () { throw new Error("Not implemented"); }


    });

    RemoteTlkeChannel.deserialize = function (dto) {
        throw new Error("Not implemented");
    };



    return RemoteTlkeChannel;
});