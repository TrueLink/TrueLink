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
        },
        _enterToken: function (token, context) {
            if (!this._tokenHandlers) {
                console.warn("No token handler is set for the channel ", this);
                return;
            }
            var handler = this._tokenHandlers.getItem(null, function (item) { return token instanceof item.key; });
            if (!handler) {
                console.warn("No token handler is found for the channel ", this);
                return;
            }
            handler(token, context);
        },
        _setTokenHandler: function (tokenType, handler) {
            this._tokenHandlers = this._tokenHandlers || new HashTable();
            this._tokenHandlers.setItem(tokenType, handler.bind(this));
        }
    };
});