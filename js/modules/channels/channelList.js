define([
    "zepto",
    "modules/data-types/hex",
    "modules/channels/tlkeChannel"
], function ($, Hex, TlkeChannel) {
    "use strict";
    // handles first-order channels that operate directly by transport
    function ChannelList() {
        this.tuples = [];
        this.channelHandlers = {
            packetSender: { sendPacket: this.onChannelSendPacket.bind(this) },
            tokenPrompter: { prompt: this.onChannelPrompt.bind(this) }
        };
        this.tokenPrompter = null;
    }

    $.extend(ChannelList.prototype, {

        setChannelTokenPrompter: function (iTokenPrompter) {
            this.tokenPrompter = iTokenPrompter;
        },
        setTransport: function (iTransport) {
            this.transport = iTransport;
        },

        processPacket: function (chId, data) {
            var found = this._getTupleBy(function (tuple) {
                return tuple.inId.as(Hex).isEqualTo(chId.as(Hex));
            });
            if (found) {
                found.processPacket(data);
            }
        },

        add: function (channel) {
            this._bindChannel(channel);
            this._addTuple(channel);
        },

        onChannelPrompt: function (channel, token, context) {
            if (token instanceof TlkeChannel.TlkeChannelGeneratedToken) {
                var ch = this._getTupleByChannel(channel);
                ch.inId = token.inId;
                ch.outId = token.outId;
                this.transport.openChannel(token.inId);
            }
            this.tokenPrompter.prompt(channel, token, context);
        },

        onChannelSendPacket: function (channel, data) {
            var outId = this._getTupleByChannel(channel).outId;
            if (outId) {
                this.transport.sendPacket(outId, data);
            }
        },

        _bindChannel: function (ch) {
            var handlers = this.channelHandlers;
            ch.setPacketSender(handlers.packetSender);
            ch.setTokenPrompter(handlers.tokenPrompter);
            ch.setRng(this.random);
            this._addTuple(ch);
        },

        _addTuple: function (ch) {
            this.tuples.push({
                channel: ch,
                inId: null,
                outId: null
            });
        },

        _getTupleByChannel: function (ch) {
            return this._getTupleBy(function (tuple) {
                return tuple.channel === ch;
            });
        },
        _getTupleBy: function (fn) {
            var found = this.tuples.filter(fn);
            if (found.length) {
                return found[0];
            }
            return null;
        }

    });

    return ChannelList;
});