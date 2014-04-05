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

    function Contact() { // : ITokenPrompter, IDirtyNotifier, IMessageProcessor
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

        // IContactDirtyNotifier notifier:
        // void notifyContactDirty(Contact contact, Channel channel);
        setDirtyNotifier: function (notifier) {
            invariant($.isFunction(notifier.notifyContactDirty), "notifier is not implementing IContactDirtyNotifier");
            this.dirtyNotifier = notifier;
        },

        // ITlChannelOwner tlOwner:
        // void createTlChannel(inId, outId, key, hashStart, backHashEnd)
        setTlChannelOwner: function (tlOwner) {
            invariant($.isFunction(tlOwner.createTlChannel), "tlOwner is not implementing ITlChannelOwner");
            this.tlOwner = tlOwner;
        },

        // IChannelRouter, IPacketSender router:
        // void addRoute(IPacketProcessor packetReceiver, Channel channel, multivalue inId, multivalue outId)
        // void removeRoute(Channel channel)
        setPacketRouter: function (router) {
            invariant($.isFunction(router.addRoute), "router is not implementing IChannelRouter");
            invariant($.isFunction(router.removeRoute), "router is not implementing IChannelRouter");
            invariant($.isFunction(router.sendChannelPacket), "router is not implementing IPacketSender");
            this.packetRouter = router;
        },

        // IMessageSender sender:
        // void sendInternalMessage(Contact sender, PlainObject data)
        setMessageSender: function (sender) {
            invariant(sender && $.isFunction(sender.sendMessage), "sender is not implementing IMessageSender");
            this.messageSender = sender;
        },

        // IMessageProcessor
        //the message received via TlChannel
        processChannelMessage: function (channel, msgData) {
            try {
                var message = ContactMessage.deserialize(msgData);
                if (message.type === ContactMessage.MSG_TYPE_USER) {
                    this.messages.push(message.data);
                    this._notifyDirty();
                } else if (message.type === ContactMessage.MSG_TYPE_WRAPPER) {
                    this._processTokenMessage(tokens.deserialize(message.data), message.context);
                } else if (message.type === ContactMessage.MSG_TYPE_HASH) {
                    var ht = Hex.serialize(message.data);
                    channel.enterToken(new tokens.HtChannel.HtToken(ht));
                }
            } catch (ex) {
                this._setError(ex);
            }
        },

        // IPacketProcessor:
        // (packet from packetRouter)
        processPacket: function (channel, packetData) {
            invariant(packetData && packetData.as, "packetData must be multivalue");
            try {
                var htChannelFound = this.channels.item(channel);
                if (htChannelFound) {
                    channel.processPacket(packetData);
                } else {
                    console.warn("could not find the channel packet receiver");
                }
            } catch (ex) {
                this._setError(ex);
            }
        },

        generateTlke: function () {
            try {
                this.tlkeChannel = new TlkeChannel();
                this._addChannel(this.tlkeChannel);
                this.tlkeChannel.enterToken(tokens.tlkeChannel.GenerateToken());
            } catch (ex) {
                this._setError(ex);
            }
        },

        acceptTlkeOffer: function (offer) {
            invariant(offer && $.isFunction(offer.as), "offer must be multivalue");
            try {
                this.tlkeChannel.enterToken(new tokens.TlkeChannel.OfferToken(offer));
            } catch (ex) {
                this._setError(ex);
            }
        },
        acceptTlkeAuth: function (auth) {
            invariant(auth && $.isFunction(auth.as), "auth must be multivalue");
            try {
                this.tlkeChannel.enterToken(new tokens.TlkeChannel.AuthToken(auth));
            } catch (ex) {
                this._setError(ex);
            }
        },

        generateNewChannel: function () {
            try {
                var newTlke = new TlkeChannel();
                this._addChannel(newTlke, urandom.int(1, 0xffffff));
                newTlke.enterToken(new tokens.TlkeChannel.GenerateToken());
            } catch (ex) {
                this._setError(ex);
            }
        },

        // ITokenPrompter:
        promptChannelToken: function (channel, token, context) {
            var info = this.channels.item(channel);
            // channel was removed from this.channels
            if (!info) { return; }

            if (token instanceof tokens.TlkeChannel.TlkeChannelGeneratedToken) {
                // learn new ids
                this._notifyChannelNewIds(channel, token.inId, token.outId);
            } else if (token instanceof tokens.TlkeChannel.ChangeStateToken) {
                if (info.context) {
                    this.lastLevel2ChannelState = token.state;
                } else {
                    this.state = token.state;
                }
                this._notifyDirty();
            } else if (token instanceof tokens.HtChannel.InitToken) {
                this._createHtChannel(token);
            }

            if (!info.context) {
                // first tlke channel
                this.tokens.push({token: token, context: context});
                this._notifyDirty();
            } else {
                // tlke channels over tl channels
                this.onLevel2ChannelToken(channel, token, info.context);
            }
        },

        // IDirtyNotifier
        notifyChannelDirty: function (channel) {
            this._notifyDirty(channel);
        },

        onLevel2ChannelToken: function (channel, token, context) {
            if ((token instanceof tokens.TlkeChannel.OfferToken) && token.offer) {
                this._sendToken(token, context);
            } else if ((token instanceof tokens.TlkeChannel.AuthToken) && token.auth) {
                this._sendToken(token, context);
            }
        },

        _sendToken: function (token, context) {
            invariant(this.messageSender, "messageSender is not set");
            var message = new ContactMessage(ContactMessage.MSG_TYPE_WRAPPER, token.serialize(), context);
            this.messageSender.sendMessage(this, message.serialize());
        },

        _notifyChannelNewIds: function (channel, inId, outId) {
            invariant(this.packetRouter, "packetRouter is not set");
            this.packetRouter.addRoute(this, channel, inId, outId);
        },

        _createHtChannel: function (token) {
            var htChannel = new HtChannel();
            var prompter = this.bind(function (token) {
                if (token instanceof tokens.HtChannel.HtToken) {
                    this._sendHt(htChannel, token.ht);
                } else if (token instanceof tokens.TlChannel.InitToken) {
                    this._notifyTlReady(token);
                }
            });
            htChannel.setTokenPrompter(prompter);
            htChannel.setMessageProcessor(this);
            this.channels.item(htChannel, {});
            this._notifyChannelNewIds(htChannel, token.inId, token.outId);
        },

        _sendHt: function (channel, ht) {
            var messageData = ht.as(Hex).serialize();
            var message = new ContactMessage(ContactMessage.MSG_TYPE_HASH, messageData);
            channel.sendMessage(message.serialize());
        },

        _addChannel: function (channel, reference) {
            channel.setTokenPrompter(this);
            channel.setDirtyNotifier(this);
            channel.setPacketSender(this.packetRouter);
            channel.setRng(this.random);
            this.channels.item(channel, {
                context: reference
            });
            this._notifyDirty();
        },

        // process token from the message received via TlChannel
        _processTokenMessage: function (token, context) {
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

        _notifyDirty: function (channel) {
            invariant(this.dirtyNotifier, "dirtyNotifier is not set");
            this.dirtyNotifier.notifyContactDirty(this, channel);
        },

        _notifyTlReady: function (token) {
            invariant(this.tlOwner, "tlOwner is not set");
            this.tlOwner.createTlChannel(token.inId, token.outId, token.key, token.hashStart, token.backHashEnd)
        },
        _setError: function (ex) {
            this.lastError = ex.message || JSON.stringify(ex);
            this._notifyDirty();
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