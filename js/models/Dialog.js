define(function(require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var TypeFilter = require("models/filters/TypeFilter");

    function Dialog() {
        this._defineEvent("changed");

        this.profile = null;
        this.name = null;
        this.messages = [];
        this.contacts = [];
        this.unreadCount = 0;

        this.typeFilter = new TypeFilter("receiver", "dialog");
        this.typeFilter.on("filtered", this._processMessage, this);
        this.typeFilter.on("unfiltered", this._onMessage, this);
    }

    extend(Dialog.prototype, eventEmitter, serializable, model, {
        setProfile: function(profile) {
            this.profile = profile;
        },

        init: function(args) {
            invariant(args.name, "Can i haz args.name?");
            this.name = args.name;
            this._onChanged();
        },

        addContact: function(contact) {
            if (this.contacts.indexOf(contact) !== -1) {
                return;
            }
            this.contacts.push(contact);
            contact.tlConnection.on("message", this.processMessage, this);
        },

        sendMessage: function(message) {
            var msg = {
                text: message,
                sender: this.profile.name
            };
            this._pushMessage(extend({}, msg, {
                isMine: true
            }));
            this.typeFilter.unfilter(msg);
            this._onChanged();
        },

        processMessage: function(message) {
            this.typeFilter.filter(message);
        },

        processInvite: function(invite) {
            var message = {};
            message.type = "tlgr-invite";
            message.sender = invite.contact.name;
            message.inviteId = invite.id;
            message.unread = true;
            message.accepted = null;
            message.accept = (function() {
                this.accepted = true;
                this.contact.acceptInvite(message.inviteId)
            }).bind(message);
            message.reject = (function() {
                this.accepted = false;
                this.contact.rejectInvite(this.inviteId)
            }).bind(message);
            this._pushMessage(message);
        },

        _processMessage: function(message) {
            var tlConnection = message.metadata.tlConnection;
            this.contacts.forEach(function(contact) {
                if (contact.tlConnection === tlConnection) {
                    message.sender = contact.name;
                }
            });
            message.unread = true;
            this._pushMessage(message);
        },

        _pushMessage: function(message) {
            message.time = new Date();
            //message.dialog = this;
            this.messages.push(message);
            if (message.unread) {
                this.unreadCount += 1;
            }
            this._onChanged();
        },

        markAsRead: function() {
            if (this.unreadCount) {
                this.messages.forEach(function(msg) {
                    if (msg.unread) {
                        msg.unread = false;
                    }
                });
                this.unreadCount = 0;
                this._onChanged();
            }
        },
        hasSecureChannels: function() {
            var contacts = this.contacts,
                i;
            for (i = 0; i < contacts.length; i += 1) {
                if (contacts[i].tlConnection.canSendMessages()) {
                    return true;
                }
            }
            return false;
        },

        serialize: function(packet, context) {
            var firstUnreadIndex = null,
                lastUnreadIndex = null;
            this.messages.forEach(function(msg, index) {
                delete msg.metadata;
                if (msg.unread) {
                    firstUnreadIndex = (firstUnreadIndex || firstUnreadIndex === 0) ? firstUnreadIndex : index;
                    lastUnreadIndex = index;
                }
            });
            packet.setData({
                _type_: "Dialog",
                name: this.name,
                fields: this.fields,
                unread: this.unreadCount,
                messages: this.unreadCount ? this.messages.slice(firstUnreadIndex, lastUnreadIndex + 1) : []
            });
            packet.setLink("contacts", context.getPacket(this.contacts));
        },
        deserialize: function(packet, context) {
            this.checkFactory();
            var data = packet.getData();
            var factory = this._factory;
            this.name = data.name;
            this.fields = data.fields;
            this.unreadCount = data.unread;
            this.messages = data.messages || [];
            var contacts = context.deserialize(packet.getLink("contacts"), factory.createContact, factory);
            contacts.forEach(this.addContact, this);
        },

        _onMessage: function(message) {
            this.contacts.forEach(function(contact) {
                contact.tlConnection.sendMessage(message);
            }, this);
        }



    });

    module.exports = Dialog;
});
