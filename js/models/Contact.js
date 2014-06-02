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
    }

    extend(Contact.prototype, eventEmitter, serializable, model, {

        setProfile: function (profile) {
            this.profile = profile;
        },

        serialize: function (packet, context) {
            packet.setData({name: this.name});

        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this.factory;
            var data = packet.getData();
            this.name = data.name;
        }

    });

    module.exports = Contact;
});