define([
    "zepto",
    "modules/channels/channelExtensions",
    "modules/channels/tokens",
    "modules/channels/contactChannelGroup",
    "modules/channels/tlkeChannel",
    "modules/data-types/hex",
    "modules/couchTransport",
    "modules/hashTable",
    "tools/random"
], function ($, extensions, tokens, ContactChannelGroup, TlkeChannel, Hex, CouchTransport, HashTable, random) {
    "use strict";

    function App(id) {

        this.stateChanged = null;

        this.transport = new CouchTransport("http://couch.ctx.im:5984/tl_channels", null, id);
        this.transport.handler = this.onTransportPacket.bind(this);

        // contact => {
        //   name: "John Doe"
        //   tokens: [{token: token, context: context}],
        //   messages: [text: "bla"],
        //   state: 1,
        //   overChannelLastState: 2
        //   error: Error
        // }
        this.data = new HashTable();

        // id => contactChannelGroup (for incoming packet routing)
        this.channelIds = {};

        this.lastContactName = null;

    }

    $.extend(App.prototype, {
        onStateChanged: function () {
            if (typeof this.stateChanged === "function") {
                this.stateChanged();
            }
        },

        generateTlkeFor: function (contact) {
            contact.enterToken(new tokens.ContactChannelGroup.GenerateTlkeToken());
        },
        acceptTlkeOferFor: function (contact, offer) {
            contact.enterToken(new tokens.ContactChannelGroup.OfferToken(offer));
        },
        acceptTlkeAuthFor: function (contact, auth) {
            contact.enterToken(new tokens.ContactChannelGroup.AuthToken(auth));
        },

        createOverChannel: function (contact) {
            contact.enterToken(new tokens.ContactChannelGroup.GenerateOverTlkeToken());
        },

        getLastContactName: function () { return this.lastContactName; },

        sendTextMessage: function (contact, messageData) {
            this._addMessage(contact, messageData);
            contact.sendMessage(messageData);
        },

        onContactStateChanged: function (contact) {
            this.onStateChanged();
        },

        addPrompt: function (contact, token, context) {
            var info = this.data.getItem(contact);
            info.prompts.push({token: token, context: context});
            this.data.setItem(contact, info);
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
                var info = this.data.getItem(contact);
                info.state = token.state;
                this.data.setItem(contact, info);
            } else if (token instanceof tokens.ContactChannelGroup.OverChannelChangeStateToken) {
                var c = this.data.getItem(contact);
                c.overChannelLastState = token.state;
                this.data.setItem(contact, c);
            }
            this.onStateChanged();
        },

        onContactMessage: function (contact, message) {
            this._addMessage(contact, message);
        },

        onContactSendPacket: function (contact, packet) {
            var chIdStr = packet.receiver.as(Hex).serialize();
            var data = packet.data.as(Hex).serialize();
            this.transport.sendMessage(chIdStr, data);
        },

        onTransportPacket: function (chId, data) {
            var contact = this.channelIds[chId];
            if (contact) {
                try {
                    contact.processPacket({
                        receiver: Hex.deserialize(chId),
                        data: Hex.deserialize(data)
                    });
                } catch (ex) {
                    console.error(ex);
                    var ownerInfo = this.data.getItem(contact);
                    ownerInfo.error = ex;
                    this.data.setItem(contact, ownerInfo);
                    this.onStateChanged();
                }
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
            this._setPacketSender(contact, this.onContactSendPacket);
            this._setMsgProcessor(contact, this.onContactMessage);
            contact.setRng(random);
            this.data.setItem(contact, {
                name: name,
                prompts: [],
                messages: [],
                state: TlkeChannel.STATE_NOT_STARTED
            });
            this.lastContactName = name;
            this.onStateChanged();
        },

        _addMessage: function (contact, data) {
            var info = this.data.getItem(contact);
            info.messages.push(data);
            this.data.setItem(contact, info);
            this.onStateChanged();
        },
    }, extensions);
    return App;

});