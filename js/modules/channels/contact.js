define([
    "zepto",
    "modules/dictionary",
    "tools/invariant",
    "modules/channels/tokens",
    "modules/channels/tlkeChannel",
    "modules/channels/tlChannel",
    "tools/urandom"
], function ($, Dictionary, invariant, tokens, TlkeChannel, TlChannel, urandom) {
    "use strict";


    //   tokens: [{token: token, context: context}],
    //   messages: [text: "bla"],
    //   state: 1,
    //   overChannelLastState: 2
    //   error: Error

    function Contact() {
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

        // IChannelRouter:
        // void addChannel(Channel channel, multivalue inId, multivalue outId)
        // void removeChannel(Channel channel)
        setPacketRouter: function (router) {
            invariant($.isFunction(router.addChannel), "router is not implementing IChannelRouter");
            invariant($.isFunction(router.removeChannel), "router is not implementing IChannelRouter");
            this.packetRouter = router;
        },

        // ITokenSender:
        // void sendInternalMessage(Contact sender, PlainObject data)
        setTokenSender: function (sender) {
            invariant(sender && $.isFunction(sender.sendInternalMessage), "sender is not implementing ITokenSender");
            this.tokenSender = sender;
        },

        _sendToken: function (token, context) {
            invariant(this.tokenSender, "tokenSender is not set");
            //{
            //  "ct" = "classname",           // command type: text (for deserialization purposes)
            //  "c" = 123456,                 // context: object or random int (for internal use)
            //  "d" = { /* plain object */ }  // data: serialized command data
            //}
            var msg = $.extend({
                c: context
            }, token.serialize());
            this.tokenSender.sendInternalMessage(this, msg);
        },

        // process internal message received via TlChannel
        processMessage: function (msg) {
            var token = tokens.deserialize(msg);
            var context = msg.c;
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

        onChannelToken: function (channel, token, context) {
            var info = this.channels.item(channel);
            // channel was removed from this.channels
            if (!info) { return; }

            if (token instanceof tokens.TlkeChannel.TlkeChannelGeneratedToken) {
                // learn new ids
                this.onChannelNewIds(channel, token);
            } else if (token instanceof tokens.TlkeChannel.ChangeStateToken) {
                if (info.context) {
                    this.lastLevel2ChannelState = token.state;
                } else {
                    this.state = token.state;
                }
                this._notifyDirty();
            } else if (token instanceof tokens.TlkeChannel.TlChannelGeneratedToken) {
                // create new generic channel
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


        onChannelNotifyDirty: function () {
            this._notifyDirty();
        },

        _addChannel: function (channel, reference) {
            this._setTokenPrompter(channel, this.onChannelToken);
            this._setDirtyNotifier(channel, this.onChannelNotifyDirty);
            if (channel instanceof TlChannel) {
                this._setMsgProcessor(channel, this.onChannelMessage);
            }
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
        }
    });

    return Contact;
});