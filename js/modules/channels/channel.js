define([], function () {
    "use strict";

    // tl channel base
    function Channel() { }

    Channel.prototype = {
        setPacketSender: function (iPacketSender) { this.packetSender = iPacketSender; },
        setTokenPrompter: function (iTokenPrompter) { this.tokenPrompter = iTokenPrompter; },
        setDirtyNotifier: function (iDirtyNotifier) { this.dirtyNotifier = iDirtyNotifier; },
        setRng: function (iRng) { this.random = iRng; },
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
        _sendPacket: function (bytes) {
            this._check("packetSender");
            this.packetSender.sendPacket(this, bytes);
        },
        _emitPrompt: function (token, context) {
            context = context || {};
            this._check("tokenPrompter");
            this.tokenPrompter.prompt(this, token, context);
        }
    };

    Channel.deserialize = function (dto) {
        throw new Error("Abstract class");
    };

    return Channel;
});