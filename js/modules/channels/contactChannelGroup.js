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


        sendMessage: function (message, channel) {
            if (!$.isPlainObject(message)) {
                throw new Error("Argument exception. message should be the plain object");
            }
            var msg = new ChannelGroupMessage(ChannelGroupMessage.MSG_TYPE_USER, message);
            // channel = channel || random
            // channel.sendMessage({t: ContactChannelGroup.MSG_TYPE_USER, c: data})
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

        // one of generic channels has issued the user message
        // assume a wrapper containing user message or tlke packet
        onChannelProcessMessage: function (channel, message) {
            var msg = ChannelGroupMessage.deserialize(message);
            switch (msg.type) {
            case ContactChannelGroup.MSG_TYPE_USER:
                // emit this message to ContactChannelGroup user
                this.onGenericMessage(msg.data, channel);
                break;
            case ContactChannelGroup.MSG_TYPE_WRAPPER:
                // process this message by fake tlke channel as a packet
                this.onTlkeMessage(msg.data, msg.context);
                break;
            }
        },

        // received user message via the specified channel
        onGenericMessage: function (data, channel) {
            if (this.msgProcessor && typeof this.msgProcessor.processMessage === "function") {
                this.msgProcessor.processMessage(data);
            }
        },

        // received a packet for fake tlke channel identified by the specified context
        onTlkeMessage: function (data, context) {
            var receiver = this._getTupleByContext(context);
            if (receiver) {
                receiver.processPacket(data);
            } else {
                console.warn("Generic channel message receiver not found");
            }
        },

        // one of channels sends a packet
        onChannelSendPacket: function (channel, data) {

        },

        onChannelNotifyDirty: function (channel) {
            this.onStateChanged();
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
            return this._getTupleBy(function (tuple) {
                return tuple.channel === ch;
            });
        },
        _getTupleByContext: function (context) {
            return this._getTupleBy(function (tuple) {
                return tuple.context === context;
            });
        },
        _getTupleBy: function (fn) {
            var found = this.genericChannelTuples.filter(fn);
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



    function ChannelGroupMessage(type, data, context) {
        this.type = type;
        this.data = data;
        this.context = context;
    }
    ChannelGroupMessage.prototype.serialize = function () {
        return {
            t: this.type,
            c: this.context,
            d: this.data
        };
    };
    ChannelGroupMessage.deserialize = function (dto) {
        return new ChannelGroupMessage(dto.t, dto.d, dto.c);
    };

    ChannelGroupMessage.MSG_TYPE_USER = "u";
    ChannelGroupMessage.MSG_TYPE_WRAPPER = "w";

    return ContactChannelGroup;
});