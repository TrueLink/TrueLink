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


    function RemoteTlkeChannel() {
    }

    RemoteTlkeChannel.prototype = new Channel();
    $.extend(RemoteTlkeChannel.prototype, {
        enterToken: function (token, context) {
            // serialize token and send packet
        },
        processPacket: function (bytes) {
            // deserialize token and prompt it
        },

        serialize: function () { throw new Error("Not implemented"); }


    });

    RemoteTlkeChannel.deserialize = function (dto) {
        throw new Error("Not implemented");
    };



    return RemoteTlkeChannel;
});