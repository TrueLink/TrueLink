define([
    "zepto",
    "modules/channels/channel",
    "modules/channels/tokens"
], function ($, Channel, tokens) {
    "use strict";


    function RemoteTlkeChannel() {}

    RemoteTlkeChannel.prototype = new Channel();
    $.extend(RemoteTlkeChannel.prototype, {
        enterToken: function (token, context) {
            this._sendPacket(tokens.serialize(token));
        },
        processPacket: function (packet) {
            this._emitPrompt(tokens.deserialize(packet));
        },

        serialize: function () { throw new Error("Not implemented"); }

    });

    RemoteTlkeChannel.deserialize = function (dto) {
        throw new Error("Not implemented");
    };



    return RemoteTlkeChannel;
});