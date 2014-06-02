define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");


    function Contact(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");
        this.name = null;
        this.profile = null;
    }

    extend(Contact.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {
            invariant(this.profile, "profile is not set");
            packet.setData({name: this.name});
            packet.setLink("profile", context.getPacket(this.profile));

        },
        deserialize: function (packet, context) {
            var factory = this.factory;
            var data = packet.getData();
            this.name = data.name;
            this.profile = context.deserialize(packet.getLink("profile"), factory.createProfile.bind(factory));
            this.factory = this.factory.createContactFactory(this);
        },
        init: function () {

        }

    });

    module.exports = Contact;
});