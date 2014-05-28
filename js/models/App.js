define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var fixedId = require("mixins/fixedId");
    var model = require("mixins/model");
    var urandom = require("modules/urandom/urandom");

    var maxBgIndex = 3;

    function Application(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");
        this.fixedId = Application.id;
        this.transport = null;
        this.menu = null;
        this.profiles = [];
        this.currentProfile = null;
        this.router = null;
        this.defaultPollingUrl = "http://localhost:5984/tl_channels";
    }

    extend(Application.prototype, eventEmitter, serializable, fixedId, model, {
        serialize: function (packet, context) {
            //console.log("serializing App");
            packet.setData({});
            packet.setLink("transport", context.getPacket(this.transport));
            packet.setLink("profiles", context.getPacket(this.profiles));
            packet.setLink("currentProfile", context.getPacket(this.currentProfile));
            packet.setLink("menu", context.getPacket(this.menu));
            packet.setLink("router", context.getPacket(this.router));

        },
        deserialize: function (packet, context) {
            console.log("deserializing App");
            var factory = this.factory;
            this.transport = context.deserialize(packet.getLink("transport"), factory.createTransport.bind(factory));
            this.profiles = context.deserialize(packet.getLink("profiles"), factory.createProfile.bind(factory, this));
            this.currentProfile = context.deserialize(packet.getLink("currentProfile"), factory.createProfile.bind(factory, this));

            try {
                this.menu = context.deserialize(packet.getLink("menu"), factory.createMenu.bind(factory, this));
            } catch (ex) {
                this.menu = this._createMentu();
            }

            try {
                this.router = context.deserialize(packet.getLink("router"), factory.createRouter.bind(factory));
                this.router.on("changed", this.onChanged, this);
            } catch (ex) {
                this.router = this._createRouter();
            }

        },

        _createRouter: function () {
            var router = this.factory.createRouter();
            router.on("changed", this.onChanged, this);
            router.navigate("home", this);
            return router;
        },

        _createMentu: function () {
            return this.factory.createMenu(this);
        },

        init: function () {
            console.log("app init");
            this.transport = this.factory.createTransport();
            this.transport.init();

            this.menu = this._createMentu();
            this.router = this._createRouter();
            this.addProfile();
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
            var nextBgIndex = 0;
            this.profiles.forEach(function (profile) {
                if (profile.bg >= nextBgIndex) { nextBgIndex = profile.bg + 1; }
                if (nextBgIndex > maxBgIndex) { nextBgIndex = 0; }
            });
            var profile = this.factory.createProfile(this);
            profile.set({
                name: urandom.name(),
                bg: nextBgIndex,
                pollingUrl: this.defaultPollingUrl
            });
            this.currentProfile = profile;
            this.profiles.push(profile);
            this.onChanged();
        }

    });

    Application.id = "0BF08932-8384-47B3-8554-6FEC3C2B158D";
    module.exports = Application;
});


