define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var urandom = require("modules/urandom/urandom");

    function Profile() {
        this._defineEvent("changed");

        this.app = null;
        this.bg = null;
        this.documents = [];
        this.contacts = [];
        this.dialogs = [];
        this.pollingUrl = "";
    }

    extend(Profile.prototype, eventEmitter, serializable, model, {
        // called by factory
        setApp: function (app) {
            this.app = app;
        },
        serialize: function (packet, context) {
            packet.setData({
                name: this.name,
                bg: this.bg,
                pollingUrl: this.pollingUrl
            });

            packet.setLink("documents", context.getPacket(this.documents));
            packet.setLink("contacts", context.getPacket(this.contacts));
            packet.setLink("dialogs", context.getPacket(this.dialogs));
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this.factory;
            var data = packet.getData();
            this.name = data.name;
            this.bg = data.bg;
            this.pollingUrl = data.pollingUrl;
            this.documents = context.deserialize(packet.getLink("documents"), factory.createDocument.bind(factory));
            this.contacts = context.deserialize(packet.getLink("contacts"), factory.createContact.bind(factory));
            this.dialogs = context.deserialize(packet.getLink("dialogs"), factory.createDialog.bind(factory));

        },
        createDocument: function () {
            this.checkFactory();
            var document = this.factory.createDocument();
            document.set({
                name: urandom.animal()
            });
            this.documents.push(document);
            this.onChanged();
            return document;
        },
        createContact: function () {
            this.checkFactory();
            var contact = this.factory.createContact(this);
            contact.set("name", urandom.name());
            contact.init();
            this.contacts.push(contact);
            this.onChanged();
            return contact;
        },

        _findDirectDialog: function (contact) {
            var i;
            for (i = 0; i < this.dialogs.length; i += 1) {
                if (this.dialogs[i].contacts.length === 1 &&  this.dialogs[i].contacts[0] === contact) {
                    return this.dialogs[i];
                }
            }
            return null;
        },

        startDirectDialog: function (contact) {
            this.checkFactory();
            var dialog = this._findDirectDialog(contact);
            if (!dialog) {
                dialog = this.factory.createDialog();
                dialog.set("name", contact.name);
                dialog.addContact(contact);
                this.dialogs.push(dialog);
                this.onChanged();
            }
            return dialog;
        }
    });

    module.exports = Profile;
});