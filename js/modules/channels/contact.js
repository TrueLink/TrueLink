define([
    "zepto",
    "modules/dictionary",
    "tools/invariant",
    "modules/channels/tokens",
    "modules/channels/tlkeChannel",
    "modules/channels/tlChannel"
], function ($, Dictionary, invariant, tokens, TlkeChannel, TlChannel) {
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

        generateTlke: function () {
            this.tlkeChannel = new TlkeChannel();
            this._addChannel(this.tlkeChannel);
            this.tlkeChannel.enterToken(tokens);
        },

        acceptTlkeOffer: function (offer) {

        },
        acceptTlkeAuth: function (auth) {

        },

        onChannelToken: function () {

        },
        onChannelNotifyDirty: function () {
            this._notifyDirty();
        },

        _addChannel: function (channel, reference) {
            var isOverChannel = !!reference;
            this._setTokenPrompter(channel, this.onChannelToken.bind(this, isOverChannel));
            this._setDirtyNotifier(channel, this.onChannelNotifyDirty);
            if (channel instanceof TlChannel) {
                this._setMsgProcessor(channel, this.onChannelMessage);
            }
            channel.setRng(this.random);
            this.channels.setItem(channel, {
                ref: reference
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