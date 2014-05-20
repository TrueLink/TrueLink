define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var urandom = require("urandom");
    var model = require("mixins/model");

    function Profile(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");
        this.name = urandom.name();
    }

    extend(Profile.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {
            console.log("serializing Profile");
            packet.setData({name: this.name});
        },
        deserialize: function (packet, context) {
            console.log("deserializing Profile");
            this.name = packet.getData().name;
        }

    });

    module.exports = Profile;
});