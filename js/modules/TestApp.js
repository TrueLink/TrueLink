define([
    "zepto",
    "modules/channels/channelExtensions",
    "modules/channels/tokens",
    "modules/channels/contactChannelGroup",
    "modules/channels/tlkeChannel",
    "modules/data-types/hex",
    "modules/couchTransport"
], function ($, extensions, tokens, ContactChannelGroup, TlkeChannel, Hex, CouchTransport) {
    "use strict";

    function App(id) {

        this.stateChanged = null;

        this.transport = new CouchTransport("http://couch.ctx.im:5984/tl_channels", null, id);
        this.transport.handler = this.onTransportPacket.bind(this);
        // name => contactChannelGroup
        this.contacts = {};
        // id => contactChannelGroup (for incoming packet routing)
        this.channelIds = {};

        // contactChannelGroup => [{token: token, context: context}]
        this.contactPromts = new HashTable();

        // contactChannelGroup => int
        this.contactStates = new HashTable();
    }

    $.extend(App.prototype, {
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

        generateTlkeFor: function (contact) {
            contact.enterToken(new tokens.ContactChannelGroup.GenerateTlkeToken.GenerateToken());
        },
        getStateFor: function (contact) {

        },
        getPromptsFor: function (contact) {
            var prompts = this.contactPromts.getItem(contact);
            return prompts || [];
        },

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

        addPrompt: function (contact, token, context) {
            var prompts = this.contactPromts.getItem(contact) || [];
            prompts.push({token: token, context: context});
            this.contactPromts.setItem(contact, prompts);
            this.onStateChanged();
        },
        onContactPrompt: function (contact, token, context) {
            if (token instanceof tokens.ContactChannelGroup.ChannelAddedToken) {
                this.onContactOpenChannel(contact, token.inId);
            } else if (token instanceof tokens.ContactChannelGroup.OfferToken) {
                this.addPrompt(contact, token, context);
            } else if (token instanceof tokens.ContactChannelGroup.AuthToken) {
                this.addPrompt(contact, token, context);
            } else if (token instanceof tokens.ContactChannelGroup.ChangeStateToken) {
                this.contactStates.setItem(contact, token.state);
            }

        },

        onContactSendPacket: function (contact, packet) {
            this.transport.sendMessage(packet.receiver, packet.data);
        },

        onTransportPacket: function (chId, data) {
            var contact = this.channelIds[chId];
            if (contact) {
                contact.processPacket({receiver: chId, data: data});
            } else {
                console.warn("Could not find the receiver for transport packet");
            }
        },
        onContactOpenChannel: function (contact, channelId) {
            var chId = channelId.as(Hex).toString();
            this.transport.addChannel(chId);
            this.channelIds[chId] = contact;
        },

        addContact: function (name) {
            var contact = new ContactChannelGroup();
            this._setDirtyNotifier(contact, this.onContactStateChanged);
            this._setTokenPrompter(contact, this.onContactPrompt);
            this.contacts[name] = contact;
            this.contactStates.setItem(contact, TlkeChannel.STATE_NOT_STARTED);
            this.onStateChanged();
        }
    }, extensions);
    return App;

});