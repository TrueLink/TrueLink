define([
    "zepto",
    "modules/dictionary",
    "tools/invariant",
    "modules/channels/tokens",
    "modules/channels/tlkeChannel",
    "modules/channels/htChannel",
    "tools/urandom",
    "tools/bind",
    "modules/data-types/hex"
], function ($, Dictionary, invariant, tokens, TlkeChannel, HtChannel, urandom, bind, Hex) {
    "use strict";

    function Contact() { // : IPacketSender, ITokenPrompter, IDirtyNotifier, IMessageProcessor
        this.messages = [];
        this.tokens = [];
        this.state = null;
        this.lastError = null;
        this.lastLevel2ChannelState = null;

        this.packetRouter = null;
        this.channels = new Dictionary();
        this.tlkeChannel = null;
    }

    $.extend(Contact.prototype, {

        setDirtyNotifier: function (notifier) {
            invariant($.isFunction(notifier.notify), "notifier is not implementing IDirtyNotifier");
            this.notifier = notifier;
        },

        setTokenPrompter: function (prompter) {
            invariant($.isFunction(prompter.prompt), "prompter is not implementing ITokenPrompter");
            this.prompter = prompter;
        },

        // IChannelRouter:
        // void addChannel(Channel channel, multivalue inId, multivalue outId)
        // void removeChannel(Channel channel)
        setPacketRouter: function (router) {
            invariant($.isFunction(router.addChannel), "router is not implementing IChannelRouter");
            invariant($.isFunction(router.removeChannel), "router is not implementing IChannelRouter");
            this.packetRouter = router;
        },

        // IMessageSender:
        // void sendInternalMessage(Contact sender, PlainObject data)
        setMessageSender: function (sender) {
            invariant(sender && $.isFunction(sender.sendMessage), "sender is not implementing IMessageSender");
            this.messageSender = sender;
        },

        //the message received via TlChannel
        processChannelMessage: function (channel, msgData) {
            var message = ContactMessage.deserialize(msgData);
            if (message.type === ContactMessage.MSG_TYPE_USER) {
                this.messages.push(message.data);
                this._notifyDirty();
            } else if (message.type === ContactMessage.MSG_TYPE_WRAPPER) {
                this.processTokenMessage(tokens.deserialize(message.data), message.context);
            } else if (message.type === ContactMessage.MSG_TYPE_HASH) {
                var ht = Hex.serialize(message.data);
                channel.enterToken(new tokens.HtChannel.HtToken(ht));
            }
        },

        // process token from the message received via TlChannel
        processTokenMessage: function (token, context) {
            var found = this.channels.first(function (item) { return item.context === context; });
            if (!found && !(token instanceof tokens.TlkeChannel.OfferToken)) {
                console.warn("could not find a receiver for the token");
                return;
            }

            if (token instanceof tokens.TlkeChannel.OfferToken) {
                this._createLevel2Tlke(context, token);
            } else if (token instanceof tokens.TlkeChannel.AuthToken) {
                found.key.enterToken(token);
            }
        },

        _createLevel2Tlke: function (context, token) {
            var newTlke = new TlkeChannel();
            this._addChannel(newTlke, context);
            newTlke.enterToken(new tokens.TlkeChannel.OfferToken(token.offer));
        },


        generateTlke: function () {
            this.tlkeChannel = new TlkeChannel();
            this._addChannel(this.tlkeChannel);
            this.tlkeChannel.enterToken(tokens.tlkeChannel.GenerateToken());
        },

        acceptTlkeOffer: function (offer) {
            invariant(offer && $.isFunction(offer.as), "offer must be multivalue");
            this.tlkeChannel.enterToken(new tokens.TlkeChannel.OfferToken(offer));
        },
        acceptTlkeAuth: function (auth) {
            invariant(auth && $.isFunction(auth.as), "auth must be multivalue");
            this.tlkeChannel.enterToken(new tokens.TlkeChannel.AuthToken(auth));
        },

        generateNewChannel: function () {
            var newTlke = new TlkeChannel();
            this._addChannel(newTlke, urandom.int(1, 0xffffff));
            newTlke.enterToken(new tokens.TlkeChannel.GenerateToken());
        },

        // ITokenPrompter:
        promptChannelToken: function (channel, token, context) {
            var info = this.channels.item(channel);
            // channel was removed from this.channels
            if (!info) { return; }

            if (token instanceof tokens.TlkeChannel.TlkeChannelGeneratedToken) {
                // learn new ids
                this.onChannelNewIds(channel, token.inId, token.outId);
            } else if (token instanceof tokens.TlkeChannel.ChangeStateToken) {
                if (info.context) {
                    this.lastLevel2ChannelState = token.state;
                } else {
                    this.state = token.state;
                }
                this._notifyDirty();
            } else if (token instanceof tokens.HtChannel.InitToken) {
                this.onNewTlChannelKeysReady(token);
            }

            if (!info.context) {
                // first tlke channel
                this.tokens.push({token: token, context: context});
            } else {
                // tlke channels over tl channels
                this.onLevel2ChannelToken(channel, token, info.context);
            }
        },

        onLevel2ChannelToken: function (channel, token, context) {
            if ((token instanceof tokens.TlkeChannel.OfferToken) && token.offer) {
                this._sendToken(token, context);
            } else if ((token instanceof tokens.TlkeChannel.AuthToken) && token.auth) {
                this._sendToken(token, context);
            }
        },

        onChannelNewIds: function (channel, inId, outId) {
            invariant(this.packetRouter, "packetRouter is not set");
            this.packetRouter.addChannel(channel, inId, outId);
        },

        onNewTlChannelKeysReady: function (token) {
            // todo store htChannels
            var htChannel = new HtChannel();

            var prompter = this.bind(function (token) {
                if (token instanceof tokens.HtChannel.HtToken) {
                    this._sendHt(htChannel, token.ht);
                } else if (token instanceof tokens.TlChannel.InitToken) {
                    this._emitToken(token);
                }
            });
            htChannel.setTokenPrompter(prompter);
            htChannel.setMessageProcessor(this);
            this.onChannelNewIds(htChannel, token.inId, token.outId);
        },

        _sendHt: function (channel, ht) {
            var messageData = ht.as(Hex).serialize();
            var message = new ContactMessage(ContactMessage.MSG_TYPE_HASH, messageData);
            channel.sendMessage(message.serialize());
        },


        notifyChannelDirty: function (channel) {
            this._notifyDirty();
        },

        _addChannel: function (channel, reference) {
            channel.setTokenPrompter(this);
            channel.setDirtyNotifier(this);
            channel.setPacketSender(this.packetRouter);
            channel.setRng(this.random);
            this.channels.setItem(channel, {
                context: reference
            });
            this._notifyDirty();
        },

        _notifyDirty: function () {
            if (this.notifier) {
                this.notifier.notify(this);
            }
        },

        _emitToken: function (token) {
            invariant(this.prompter, "tokenPrompter is not set");
            this.prompter.prompt(this, token);
        },

        _sendToken: function (token, context) {
            invariant(this.messageSender, "messageSender is not set");
            var message = new ContactMessage(ContactMessage.MSG_TYPE_WRAPPER, token.serialize(), context);
            this.messageSender.sendMessage(this, message.serialize());
        }
    }, bind);

    function ContactMessage(type, data, context) {
        this.data = data;
        this.type = type;
        this.context = context;
    }
    ContactMessage.prototype.serialize = function () {
        var serialized = {
            t: this.type,
            d: this.data
        };
        if (this.context !== undefined) {
            serialized.c = this.context;
        }
    };
    ContactMessage.deserialize = function (dto) {
        return new ContactMessage(dto.t, dto.d, dto.c);
    };
    ContactMessage.MSG_TYPE_USER = "u";
    ContactMessage.MSG_TYPE_WRAPPER = "c";
    ContactMessage.MSG_TYPE_HASH = "h";

    return Contact;
});