define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");


    function Contact(factory, profile) {
        invariant(factory, "Can be constructed only with factory");
        invariant(profile, "Can i haz profile?");
        this.factory = factory;
        this._defineEvent("changed");
        this.profile = profile;
        this.name = null;
        this.tlConnection = null;
    }

    extend(Contact.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {
            packet.setData({name: this.name});
            packet.setLink("tlConnection", context.getPacket(this.tlConnection));

        },
        deserialize: function (packet, context) {
            var factory = this.factory;
            var data = packet.getData();
            this.name = data.name;
            this.tlConnection = context.deserialize(packet.getLink("tlConnection"), factory.createContactTlConnection.bind(factory, this));
        },
        init: function () {
            this.tlConnection = this.factory.createContactTlConnection(this);
        }

    });

    module.exports = Contact;
});