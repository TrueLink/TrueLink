define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");


    function Dialog(factory, profile) {
        invariant(factory, "Can be constructed only with factory");
        invariant(profile, "Can i haz profile?");
        this.factory = factory;
        this._defineEvent("changed");
        this.profile = profile;

        this.name = null;
        this.fields = {};
        this.messages = [];
        this.contacts = [];
    }

    extend(Dialog.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {
            packet.setData({
                name: this.name,
                fields: this.fields
            });
            packet.setLink("contacts", context.getPacket(this.contacts));
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            var factory = this.factory;
            this.name = data.name;
            this.fields = data.fields;
            this.contacts = context.deserialize(packet.getLink("contacts"), factory.createContact.bind(factory, this));
        },
        setField: function (name, value) {
            if (this[name] === value) { return; }
            this[name] = value;
            this.onChanged();
        },
        addContact: function (contact) {
            this.contacts.push(contact);
            this.onChanged();
        }

    });

    module.exports = Dialog;
});