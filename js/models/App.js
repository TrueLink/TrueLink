define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var fixedId = require("mixins/fixedId");
    var model = require("mixins/model");


    function Application(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");
        this.fixedId = Application.id;
//        this.transport = null;
        this.menu = null;
        this.profiles = [];
        this.currentProfile = null;
        this.router = null;
    }

    extend(Application.prototype, eventEmitter, serializable, fixedId, model, {
        serialize: function (packet, context) {
            console.log("serializing App");
            packet.setData({});
//            packet.setLink("transport", context.getPacket(this.transport));
            packet.setLink("profiles", context.getPacket(this.profiles));
            packet.setLink("currentProfile", context.getPacket(this.currentProfile));
            packet.setLink("menu", context.getPacket(this.menu));
            packet.setLink("router", context.getPacket(this.router));

        },
        deserialize: function (packet, context) {
            console.log("deserializing App");
            var factory = this.factory;
//            this.transport = context.deserialize(packet.getLink("transport"), factory.createTransport.bind(factory));
            this.profiles = context.deserialize(packet.getLink("profiles"), factory.createProfile.bind(factory));
            this.currentProfile = context.deserialize(packet.getLink("currentProfile"), factory.createProfile.bind(factory));
            this.menu = context.deserialize(packet.getLink("menu"), factory.createMenu.bind(factory));
            this.menu.setApp(this);

            this.router = context.deserialize(packet.getLink("router"), factory.createRouter.bind(factory));
            this.router.on("changed", this.onChanged, this);

        },

        init: function () {
            console.log("app init");
//            this.transport = this.factory.createTransport();
            this.menu = this.factory.createMenu();
            this.menu.setApp(this);
            this.router = this.factory.createRouter();
            this.router.on("changed", this.onChanged, this);
            this.onChanged();
            this.addProfile();
            this.router.navigate("home", this);
        },

        getProfiles: function () {
            return this.profiles;
        },

        getCurrentProfile: function () {
            return this.currentProfile;
        },
        setCurrentProfile: function (profile) {
            this.set("currentProfile", profile);
        },


        addProfile: function () {
            var profile = this.factory.createProfile();
            this.currentProfile = profile;
            this.profiles.push(profile);
            this.onChanged();
        }

    });

    Application.id = "0BF08932-8384-47B3-8554-6FEC3C2B158D";
    module.exports = Application;
});


