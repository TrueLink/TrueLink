define([], function () {
    "use strict";

    function Channel() { }

    Channel.prototype = {
        setPacketSender: function (iPacketSender) { this.packetSender = iPacketSender; },
        setMsgProcessor: function (iMsgProcessor) { this.msgProcessor = iMsgProcessor; },
        setTokenPrompter: function (iTokenPrompter) { this.tokenPrompter = iTokenPrompter; },
        setDirtyNotifier: function (iDirtyNotifier) { this.dirtyNotifier = iDirtyNotifier; },
        setChannelNotifier: function (iChannelNotifier) { this.channelNotifier = iChannelNotifier; },
        setRng: function (iRng) { this.random = iRng; },
        sendMessage: function (bytes) { throw new Error("Not implemented"); },
        enterToken: function (token, context) { throw new Error("Not implemented"); },
        processPacket: function (bytes) { throw new Error("Not implemented"); },
        serialize: function () { throw new Error("Not implemented"); },
        _check: function (key) {
            if (!this[key]) {
                throw new Error("No valid " + key + " is set");
            }
        },
        _notifyDirty: function () {
            this._check("dirtyNotifier");
            this.dirtyNotifier.notify(this);
        },
        _notifyChannel: function (idsObj) {
            this._check("channelNotifier");
            this.channelNotifier.notify(idsObj);
        },
        _sendPacket: function (bytes) {
            this._check("packetSender");
            this.packetSender.sendPacket(bytes);
        },
        _emitPrompt: function (token, context) {
            context = context || {};
            this._check("tokenPrompter");
            this.tokenPrompter.prompt(token, context);
        },
        _emitUserMessage: function (message) {
            this._check("msgProcessor");
            this.msgProcessor.processMessage(message);
        }
    };

    Channel.deserialize = function (dto) {
        throw new Error("Abstract class");
    };

    return Channel;
});