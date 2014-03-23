define([
    "zepto",
    "modules/channels/tlkeChannel",
    "modules/channels/genericChannel",
    "modules/data-types/hex"
], function ($, TlkeChannel, GenericChannel, Hex) {
    "use strict";

    function ContactChannelGroup() {
        this.stateChanged = null;

        this.genericChannelTuples = [];
        this.tlke = {
            channel: null,
            state: null
        };
        this.channelHandlers = {
            msgProcessor: { processMessage: this.onChannelProcessMessage.bind(this) },
            packetSender: { sendPacket: this.onChannelSendPacket.bind(this) },
            tokenPrompter: { prompt: this.onChannelPrompt.bind(this) },
            dirtyNotifier: { processMessage: this.onChannelNotifyDirty.bind(this) }
        };
    }

    $.extend(ContactChannelGroup.prototype, {
        // openChannel(chId), sendPacket(chId, data), all multivalues
        setTransport: function (iTransport) { this.transport = iTransport; },
        processTransportPacket: function (chId, data) {
            var found = this.genericChannelTuples.filter(function (tuple) {
                return tuple.inId.as(Hex).isEqualTo(chId.as(Hex));
            });
            if (found.length) {
                found[0].processPacket(data);
            }
        },
        setMsgProcessor: function (iMsgProcessor) { this.msgProcessor = iMsgProcessor; },
        setRng: function (iRng) { this.random = iRng; },


        sendMessage: function (bytes) {

        },


        enterToken: function (token, context) {

        },

        getState: function () {
            return this.tlke.state;
        },

        tlkeCreate: function () {
            this.tlke = {
                channel: new TlkeChannel(),
                state: TlkeChannel.STATE_NOT_STARTED
            };
            this._bindChannel(this.tlke);
        },

        tlkeGenerate: function () {

        },

        tlkeAccept: function (offer) {

        },

        tlkeAcceptAuth: function (auth) {

        },

        onChannelPrompt: function (channel, token, context) {
            if (token instanceof TlkeChannel.ChangeStateToken) {
                if (channel === this.tlke) { this.tlke.state = token.state; }
                this.onStateChanged();
                return;
            }
            if (token instanceof TlkeChannel.TlkeChannelGeneratedToken) {
                var ch = this._getTupleByChannel(channel);
                ch.inId = token.inId;
                ch.outId = token.outId;
                return;
            }
            if (token instanceof TlkeChannel.GenericChannelGeneratedToken) {
                return;
            }
            if (token instanceof GenericChannel.ExpiresToken) {
                return;
            }
            if (token instanceof GenericChannel.ExpiredToken) {
                return;
            }
        },

        onChannelProcessMessage: function (channel, message) {

        },

        onChannelSendPacket: function (channel, data) {

        },

        onChannelNotifyDirty: function (channel) {

        },


        _bindChannel: function (ch) {
            if (ch instanceof GenericChannel) {
                ch.setMsgProcessor(this.msgProcessor);
            }
            ch.setPacketSender(this.packetSender);
            ch.setTokenPrompter(this.tokenPrompter);
            ch.setDirtyNotifier(this.dirtyNotifier);
            ch.setRng(this.random);
            this._addTuple(ch);
            this.onStateChanged();
        },
        _addTuple: function (ch) {
            this.genericChannelTuples.push({channel: ch, messages: [], prompts: []});
        },

        _getTupleByChannel: function (ch) {
            var found = this.genericChannelTuples.filter(function (tuple) {
                return tuple.channel === ch;
            });
            if (found.length) {
                return found[0];
            }
            return null;
        },
        onStateChanged: function () {
            if (typeof this.stateChanged === "function") {
                this.stateChanged(this);
            }
        }
    });

    return ContactChannelGroup;
});