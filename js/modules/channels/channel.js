define(["zepto", "modules/dictionary", "tools/invariant"], function ($, Dictionary, invariant) {
    "use strict";

    // tl channel base
    function Channel() { }
    Channel.prototype = {
        // IPacketSender: void sendPacket(Channel channel, Multivalue bytes)
        setPacketSender: function (packetSender) {
            invariant($.isFunction(packetSender.sendPacket), "packetSender is not implementing IPacketSender");
            this.packetSender = packetSender;
        },
        // ITokenPrompter: void prompt(Channel channel, Token token, Object context)
        setTokenPrompter: function (prompter) {
            invariant($.isFunction(prompter.prompt), "prompter is not implementing ITokenPrompter");
            this.tokenPrompter = prompter;
        },
        // IDirtyNotifier: void notify(Channel channel)
        setDirtyNotifier: function (dirtyNotifier) {
            invariant($.isFunction(dirtyNotifier.notify), "dirtyNotifier is not implementing IDirtyNotifier");
            this.dirtyNotifier = dirtyNotifier;
        },
        // IRng: multivalue bitArray(bitLength)
        setRng: function (rng) {
            invariant($.isFunction(rng.bitArray), "rng is not implementing IRng");
            this.random = rng;
        },

        // by default: search for token handlers set by this._setTokenHandler()
        enterToken: function (token, context) { this._enterToken(token, context); },

        processPacket: function (bytes) { throw new Error("Not implemented"); },
        serialize: function () { throw new Error("Not implemented"); },

        _setTokenHandler: function (tokenType, handler) {
            invariant($.isFunction(tokenType), "tokenType should be a token constructor");
            invariant($.isFunction(handler), "handler should be a function");
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