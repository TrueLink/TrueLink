define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var fixedId = require("mixins/fixedId");
    var model = require("mixins/model");


    function Transport(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this.fixedId = "F2E281BB-3C0D-4CED-A0F1-A65771AEED9A";
        this._defineEvent("changed");
    }

    extend(Transport.prototype, eventEmitter, serializable, fixedId, model, {
        serialize: function (packet, context) {
            console.log("serializing Transport");
            packet.setData({name: "TransportPacket"});
        },
        deserialize: function (packet, context) {
            console.log("deserializing Transport");
        }

    });

    module.exports = Transport;
});