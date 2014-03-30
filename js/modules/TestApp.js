define([
    "zepto",
    "modules/channels/channelExtensions",
    "modules/channels/tokens",
    "modules/channels/contactChannelGroup",
    "modules/channels/tlkeChannel",
    "modules/data-types/hex",
    "modules/couchTransport",
    "modules/hashTable",
    "tools/random",
    "tools/urandom",
    "modules/channels/syncContactChannelGroup"
], function ($, extensions, tokens, ContactChannelGroup, TlkeChannel, Hex, CouchTransport, HashTable, random, urandom, SyncContactChannelGroup) {
    "use strict";

    function App(id, isSync) {

        this.stateChanged = null;
        this.isSync = isSync;

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

        startSync: function (contact) {
            if (!(contact instanceof SyncContactChannelGroup)) {
                throw new Error("Wrong target");
            }

            var message = this.getContactsData();
            contact.sendMessage(message);
        },

        getContactsData: function () {
            var contacts = this.data.fullFilter(function (info) {
                return info.key instanceof ContactChannelGroup;
            });
            var contactsData = {};
            contacts.forEach(function (info) {
                // todo it seems that this call is temp: contact is a Channel in fact
                contactsData[info.value.name] = {channels: info.key.getChannelInfos()};
            });
            return contactsData;
        },

        onDeviceMessage: function (contact, message) {
            var response = {}, that = this;
            var remoteContactsData = message;
            var localContactsData = this.getContactsData();

            function getById(id) {
                return that.data.first(function (info) {
                    return info.name === id;
                });
            }

            $.each(remoteContactsData, function (key, value) {
                var contactInfo;
                console.log("- Do you know " + key + "?");
                if (value === null && localContactsData[key]) {
                    console.log("I'd like to meet him");
                    contactInfo = getById(key);
                    response[key] = {
                        contactData: that.exportContact(contactInfo.value),
                        yellowChannel: contactInfo.key.getYellowChannelInfo(),
                        channels: contactInfo.key.getChannelInfos()
                    };
                } else if (!localContactsData[key]) {
                    if (value.contactData && value.yellowChannel) {
                        console.log("Here's his data: ", value.contactData);
                        var imported = that.importContact(value.contactData);
                        imported.createChannels(value.yellowChannel, value.channels);
                        console.log("- Great, thanks");
                    } else {
                        console.log("- No. Introduce me please");
                        // request to provide the contact data
                        response[key] = null;
                    }
                } else {
                    console.log("- Yes, how is he?");
                    contactInfo = getById(key);
                    contactInfo.key.updateChannels(value.channels);
                    console.log("- " + urandom.answer());
                }
            });

            if (Object.keys(response).length > 0) {
                contact.sendMessage(response);
            }

        },

        importContact: function (contactData) {
            return this.addContact(contactData.name);
        },
        exportContact: function (contactInfo) {
            return { name: contactInfo.name };
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
            this._addContact(name, contact);
            return contact;
        },

        _addContact: function (name, contact) {
            this._setDirtyNotifier(contact, this.onContactStateChanged);
            this._setTokenPrompter(contact, this.onContactPrompt);
            this._setPacketSender(contact, this.onContactSendPacket);
            this._setMsgProcessor(contact, contact instanceof SyncContactChannelGroup ?
                    this.onDeviceMessage : this.onContactMessage);
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

        addSync: function (isAccepting) {
            var length = this.data.length(function (info) {
                return info.key instanceof SyncContactChannelGroup;
            });
            var name = "sync device " + (length + 1);
            var contact = new SyncContactChannelGroup();
            this._addContact(name, contact);
            if (!isAccepting) {
                contact.enterToken(new tokens.ContactChannelGroup.GenerateTlkeToken());
            }
        },

        _addMessage: function (contact, data) {
            var info = this.data.getItem(contact);
            info.messages.push(data);
            this.data.setItem(contact, info);
            this.onStateChanged();
        }
    }, extensions);
    return App;

});