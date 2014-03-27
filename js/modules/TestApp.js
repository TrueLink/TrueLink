define([
    "modules/channels/contactChannelGroup",
    "modules/data-types/hex",
    "modules/couchTransport",
    "components/channels/AppList", "tools/urandom", "zepto", "react"
], function (ContactChannelGroup, Hex, CouchTransport, AppList, urandom, $, React) {
    "use strict";

    function App(id) {

        this.stateChanged = null;

        this.transport = new CouchTransport("http://couch.ctx.im:5984/tl_channels", null, id);
        this.transport.handler = this.onTransportPacket.bind(this);
        // name => contactChannelGroup
        this.contacts = {};
        // id => name (for incoming packet routing)
        this.channelIds = {};

    }

    App.prototype = {
        //getProps: function () {
        //    return {
        //        addChannel: this.createTlkeChannel.bind(this),
        //        tlkeHandshakesInProgress: this.model.tlkeHandshakesInProgress,
        //        chatChannels: this.model.chatChannels,
        //        generate: this.generate.bind(this),
        //        accept: this.accept.bind(this),
        //        acceptAuth: this.acceptAuth.bind(this),
        //        sendTextMessage: this.sendTextMessage.bind(this)
        //    };
        //},
        onStateChanged: function () {
            if (typeof this.stateChanged === "function") {
                this.stateChanged();
            }
        },
        //// mock will call this when it's time to rerender channels in ui
        //onChannelsChanged: function () {
        //    var newModel = {chatChannels: {}, tlkeHandshakesInProgress: {}};
        //    var wrapper = this.wrapper;
        //    $.each(this.tlkeHandshakesInProgress, function (key, channel) {
        //        newModel.tlkeHandshakesInProgress[key] = wrapper.getChannelInfo(channel);
        //        newModel.tlkeHandshakesInProgress[key].name = key;
        //    });
        //    $.each(this.chatChannels, function (key, channel) {
        //        newModel.chatChannels[key] = wrapper.getChannelInfo(channel);
        //        newModel.chatChannels[key].name = key;
        //    });
//
        //    this.model = newModel;
        //    this.onStateChanged();
        //},
        //createTlkeChannel: function () {
        //    var name = urandom.name(), chatChannels = this.chatChannels, wrapper = this.wrapper;
        //    this.tlkeHandshakesInProgress[name] = this.wrapper.createTlkeChannel();
        //    wrapper.addPromptListener(this.tlkeHandshakesInProgress[name], function (token, context) {
        //        if (token instanceof TlkeChannel.GenericChannelGeneratedToken) {
        //            // handshake produced keys and transport channel ids
        //            chatChannels[name] = wrapper.createChatChannel();
        //            chatChannels[name].enterToken(token);
        //        }
        //    });
        //    this.onChannelsChanged();
        //},
//
        //generate: function (key) {
        //    try {
        //        this.tlkeHandshakesInProgress[key].enterToken(new TlkeChannel.GenerateToken());
        //    } catch (ex) {
        //        console.error(ex);
        //    }
        //},
//
        //accept: function (key, offer) {
        //    try {
        //        this.tlkeHandshakesInProgress[key].enterToken(new TlkeChannel.OfferToken(offer));
        //    } catch (ex) {
        //        console.error(ex);
        //    }
        //},
//
        //acceptAuth: function (key, auth, context) {
        //    try {
        //        this.tlkeHandshakesInProgress[key].enterToken(new TlkeChannel.AuthToken(auth));
        //        this.wrapper.removePrompt(context);
        //    } catch (ex) {
        //        console.error(ex);
        //    }
        //},
//
        //sendTextMessage: function (key, messageData) {
        //    try {
        //        // to append this message to a sender channel as my message
        //        this.wrapper.processMessage(this.chatChannels[key], messageData);
        //        this.chatChannels[key].sendMessage(messageData);
        //    } catch (ex) {
        //        console.error(ex);
        //    }
        //},

        onContactStateChanged: function (contact) {
            this.onStateChanged();
        },

        onContactSendPacket: function (contact, channelId, data) {

        },

        onTransportPacket: function (chId, data) {
            var contactName = this.channelIds[chId];
            if (contactName) {
                this.contacts[name].processPacket(Hex.deserialize(data));
            }
        },
        onContactOpenChannel: function (name, contact, channelId) {
            var chId = channelId.as(Hex).toString();
            this.transport.addChannel(chId);
            this.channelIds[chId] = name;
        },

        addContact: function (name) {
            var contact = new ContactChannelGroup();
            contact.stateChanged = this.handlers.contactStateChanged;
            contact.channelOpened = this.handlers.contactOpenChannel.bind(this, name);
            this.contacts[name] = contact;
        }
    };
    return App;

});