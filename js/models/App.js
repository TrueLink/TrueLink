define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var fixedId = require("mixins/fixedId");
    var onChanged = require("mixins/onChanged");


    function Application(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");
        this.fixedId = Application.id;
        this.transport = null;
        this.profiles = [];

    }

    extend(Application.prototype, eventEmitter, serializable, fixedId, onChanged, {
        serialize: function (packet, context) {
            console.log("serializing App");
            packet.setData({name: "AppPacket"});
            packet.setLink("transport", context.getPacket(this.transport));
            packet.setLink("profiles", context.getPacket(this.profiles));
        },
        deserialize: function (packet, context) {
            console.log("deserializing App");
            var factory = this.factory;
            this.transport = context.deserialize(packet.getLink("transport"), factory.createTransport.bind(factory));
            this.profiles = context.deserialize(packet.getLink("profiles"), factory.createProfile.bind(factory));
        },

        init: function () {
            console.log("init");
            this.transport = this.factory.createTransport();
            this.onChanged();
        },

        addProfile: function () {
            this.profiles.push(this.factory.createProfile());
            this.onChanged();
        }

    });

    Application.id = "0BF08932-8384-47B3-8554-6FEC3C2B158D";
    module.exports = Application;
});


