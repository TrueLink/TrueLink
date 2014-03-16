define([], function () {
    "use strict";

    function Channel() { }

    Channel.prototype = {
        setPacketSender: function (iPacketSender) { this.packetSender = iPacketSender; },
        setMsgProcessor: function (iMsgProcessor) { this.msgProcessor = iMsgProcessor; },
        setTokenPrompter: function (iTokenPrompter) { this.tokenPrompter = iTokenPrompter; },
        setDirtyNotifier: function (iDirtyNotifier) { this.dirtyNotifier = iDirtyNotifier; },
        sendMessage: function (bytes) { throw new Error("Not implemented"); },
        enterToken: function (token, context) { throw new Error("Not implemented"); },
        processPacket: function (bytes) { throw new Error("Not implemented"); },
        serialize: function () { throw new Error("Not implemented"); }
    };

    Channel.deserialize = function (dto) {
        throw new Error("Abstract class");
    };

    return Channel;
});