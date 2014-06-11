define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");


    function Contact() {
        this._defineEvent("changed");
        this.name = null;
        this.profile = null;
        this.tlConnection = null;
    }

    extend(Contact.prototype, eventEmitter, serializable, model, {

        setProfile: function (profile) {
            this.profile = profile;
        },

        serialize: function (packet, context) {
            packet.setData({name: this.name});
            packet.setLink("tlConnection", context.getPacket(this.tlConnection));
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            var data = packet.getData();
            this.name = data.name;
            this.tlConnection = context.deserialize(packet.getLink("tlConnection"), factory.createTlConnection.bind(factory));
        },

        init: function () {
            this.checkFactory();
            this.tlConnection = this._factory.createTlConnection();
            this._onChanged();
        }

    });

    module.exports = Contact;
});