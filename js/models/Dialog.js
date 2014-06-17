define(function (require, exports, module) {
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
        setProfile: function (profile) {
            this.profile = profile;
        },
        init: function () {
        },
        addContact: function (contact) {
            if (this.contacts.indexOf(contact) !== -1) { return; }
            this.contacts.push(contact);
            contact.tlConnection.on("message", this.processMessage, this);
        },

        sendMessage: function (message) {
            var msg = {text: message, sender: this.profile.name + " (me)"};
            this._pushMessage(msg);
            this.typeFilter.unfilter(msg);
            this._onChanged();
        },

        processMessage: function (message) {
            this.typeFilter.filter(message);
        },

        _processMessage: function (message) {
            var tlConnection = message.metadata.tlConnection;
            this.contacts.forEach(function (contact) {
                if (contact.tlConnection === tlConnection) {
                    message.sender = contact.name;
                }
            });
            this._pushMessage(message, true);
        },

        _pushMessage: function (message, incUnread) {
            message.time = new Date();
            this.messages.push(message);
            if (incUnread) {
                this.unreadCount += 1;
            }
            this._onChanged();
        },

        markAsRead: function () {
            if (this.unreadCount) {
                this.unreadCount = 0;
                this._onChanged();
            }
        },

        serialize: function (packet, context) {
            packet.setData({
                name: this.name,
                fields: this.fields,
                unread: this.unreadCount
            });
            packet.setLink("contacts", context.getPacket(this.contacts));
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var data = packet.getData();
            var factory = this._factory;
            this.name = data.name;
            this.fields = data.fields;
            this.unreadCount = data.unread;
            var contacts = context.deserialize(packet.getLink("contacts"), factory.createTlConnectionFilter, factory);
            contacts.forEach(this.addContact, this);
        },

        _onMessage: function (message) {
            this.contacts.forEach(function (contact) {
                contact.tlConnection.sendMessage(message);
            }, this);
        }



    });

    module.exports = Dialog;
});