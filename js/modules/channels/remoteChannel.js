define([
    "zepto",
    "modules/channels/channel",
    "modules/channels/tokens"
], function ($, Channel, tokens) {
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