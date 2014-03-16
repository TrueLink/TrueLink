define(["channels/channel", "zepto"], function (Channel, $) {
    "use strict";

    function EstablishChannel() {}

    EstablishChannel.prototype = new Channel();
    $.extend(EstablishChannel.prototype, {
        sendMessage: function (bytes) {  },
        enterToken: function (token, context) {
            if (token instanceof EstablishChannel.GenerateToken) {

            } else if (token instanceof EstablishChannel.AcceptToken) {

            } else if (token instanceof EstablishChannel.AuthToken) {

            }
        },
        processPacket: function (bytes) {  },
        serialize: function () { throw new Error("Not implemented"); }
    });

    EstablishChannel.deserialize = function (dto) {

    };

    EstablishChannel.GenerateToken = function () {};
    EstablishChannel.AcceptToken = function (offerBytes) {};
    EstablishChannel.AuthToken = function (authBytes) {};

    return EstablishChannel;
});