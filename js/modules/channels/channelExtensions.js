define(["modules/hashTable"], function (HashTable) {
    "use strict";
    return {
        _setPacketSender: function (channel, handler) {
            channel.setPacketSender({sendPacket: handler.bind(this)});
        },
        _setTokenPrompter: function (channel, handler) {
            channel.setTokenPrompter({prompt: handler.bind(this)});
        },
        _setDirtyNotifier: function (channel, handler) {
            channel.setDirtyNotifier({notify: handler.bind(this)});
        },
        _setMsgProcessor: function (channel, handler) {
            channel.setMsgProcessor({processMessage: handler.bind(this)});
        }
    };
});