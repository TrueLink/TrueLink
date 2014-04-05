define(["zepto", "modules/dictionary", "tools/invariant"], function ($, Dictionary, invariant) {
    "use strict";

    // tl channel base
    function Channel() { }
    Channel.prototype = {
        // IPacketSender: void sendChannelPacket(Channel channel, Multivalue bytes)
        setPacketSender: function (packetSender) {
            invariant($.isFunction(packetSender.sendChannelPacket), "packetSender is not implementing IPacketSender");
            this.packetSender = packetSender;
        },
        // bytes: multivalue
        processPacket: function (bytes) { throw new Error("Not implemented"); },

        // ITokenPrompter: void promptChannelToken(Channel channel, Token token, Object context)
        setTokenPrompter: function (prompter) {
            invariant(prompter && $.isFunction(prompter.promptChannelToken), "prompter is not implementing ITokenPrompter");
            this.tokenPrompter = prompter;
        },
        // by default: search for token handlers set by this._setTokenHandler()
        enterToken: function (token, context) { this._enterToken(token, context); },

        // IDirtyNotifier: void notifyChannelDirty(Channel channel)
        setDirtyNotifier: function (dirtyNotifier) {
            invariant(dirtyNotifier && $.isFunction(dirtyNotifier.notifyChannelDirty), "dirtyNotifier is not implementing IDirtyNotifier");
            this.dirtyNotifier = dirtyNotifier;
        },
        // IRng: multivalue bitArray(bitLength)
        setRng: function (rng) {
            invariant(rng && $.isFunction(rng.bitArray), "rng is not implementing IRng");
            this.random = rng;
        },

        serialize: function () { throw new Error("Not implemented"); },

        _setTokenHandler: function (tokenType, handler) {
            invariant($.isFunction(tokenType), "tokenType must be a token constructor");
            invariant($.isFunction(handler), "handler must be a function");
            this._tokenHandlers = this._tokenHandlers || new Dictionary();
            this._tokenHandlers.item(tokenType, handler);
        },
        _enterToken: function (token, context) {
            if (!this._tokenHandlers) {
                console.warn("No token handler is set for the channel ", this);
                return;
            }
            var handlerItem = this._tokenHandlers.first(function (item) { return token instanceof item.key; });
            if (!handlerItem) {
                console.warn("No token handler is found for the channel ", this);
                return;
            }
            handlerItem.value.call(this, token, context);
        },
        _check: function (key) {
            invariant(this[key], "No valid %s is set", key);
        },
        _notifyDirty: function () {
            this._check("dirtyNotifier");
            this.dirtyNotifier.notifyChannelDirty(this);
        },
        _sendPacket: function (bytes) {
            this._check("packetSender");
            this.packetSender.sendChannelPacket(this, bytes);
        },
        _emitPrompt: function (token, context) {
            context = context || {};
            this._check("tokenPrompter");
            this.tokenPrompter.promptChannelToken(this, token, context);
        },
        _getRandomBytes: function (bitLength) {
            this._check("random");
            return this.random.bitArray(bitLength);
        }
    };

    Channel.deserialize = function (dto) {
        throw new Error("Abstract class");
    };

    return Channel;
});