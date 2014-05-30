define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var urandom = require("modules/urandom/urandom");

    function Profile(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");

        this.app = null;
        this.bg = null;
        this.documents = [];
        this.contacts = [];
        this.dialogs = [];
        this.pollingUrl = "";
    }

    extend(Profile.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {
            //console.log("serializing Profile");
            packet.setData({
                name: this.name,
                bg: this.bg,
                pollingUrl: this.pollingUrl
            });

            packet.setLink("app", context.getPacket(this.app));
            packet.setLink("documents", context.getPacket(this.documents));
            packet.setLink("contacts", context.getPacket(this.contacts));
            packet.setLink("dialogs", context.getPacket(this.dialogs));
        },
        deserialize: function (packet, context) {
            //console.log("deserializing Profile");
            var factory = this.factory;
            this.app = context.deserialize(packet.getLink("app"), factory.createApp.bind(factory));
            factory = this.factory = this.factory.createProfileFactory(this);

            var data = packet.getData();
            this.name = data.name;
            this.bg = data.bg;
            this.pollingUrl = data.pollingUrl;
            this.documents = context.deserialize(packet.getLink("documents"), factory.createDocument.bind(factory));
            this.contacts = context.deserialize(packet.getLink("contacts"), factory.createContact.bind(factory));
            this.dialogs = context.deserialize(packet.getLink("dialogs"), factory.createDialog.bind(factory));

        },
        createDocument: function () {
            var document = this.factory.createDocument();
            document.set({
                name: urandom.animal()
            });
            this.documents.push(document);
            this.onChanged();
            return document;
        },
        createContact: function () {
            var contact = this.factory.createContact(this);
            contact.init();
            contact.set("name", urandom.name());
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