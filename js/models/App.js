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

    function Application() {
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
            packet.setData({});
            packet.setLink("transport", context.getPacket(this.transport));
            packet.setLink("profiles", context.getPacket(this.profiles));
            packet.setLink("currentProfile", context.getPacket(this.currentProfile));
            packet.setLink("menu", context.getPacket(this.menu));
            packet.setLink("router", context.getPacket(this.router));

        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this.factory;
            this.transport = context.deserialize(packet.getLink("transport"), factory.createTransport.bind(factory));
            this.profiles = context.deserialize(packet.getLink("profiles"), factory.createProfile.bind(factory));
            this.currentProfile = context.deserialize(packet.getLink("currentProfile"), factory.createProfile.bind(factory));

            try {
                this.setMenu(context.deserialize(packet.getLink("menu"), factory.createMenu.bind(factory)));
            } catch (ex) {
                console.error(ex);
                this.setMenu(this.factory.createMenu());
            }

            try {
                this.setRouter(context.deserialize(packet.getLink("router"), factory.createRouter.bind(factory)));
            } catch (ex) {
                console.error(ex);
                this.setRouter(this.factory.createRouter());
                this.router.navigate("home", this);
            }

        },


        setMenu: function (menu) {
            if (this.menu) {
                this.menu.off("currentProfileChanged", this.setCurrentProfile, this);
                this.menu.off("addProfile", this.addProfile, this);
            }

            if (menu) {
                menu.on("currentProfileChanged", this.setCurrentProfile, this);
                menu.on("addProfile", this.addProfile, this);
            }

            this.menu = menu;
        },

        setRouter: function (router) {
            if (this.router) {
                this.router.off("changed", this.onChanged, this);
            }
            if (router) {
                router.on("changed", this.onChanged, this);
            }
            this.router = router;
        },

        init: function () {
            this.checkFactory();
            console.log("app init");
            this.transport = this.factory.createTransport();
            this.transport.init();

            this.setMenu(this.factory.createMenu());
            this.setRouter(this.factory.createRouter());
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
            var nextBgIndex = 0;
            this.profiles.forEach(function (profile) {
                if (profile.bg >= nextBgIndex) { nextBgIndex = profile.bg + 1; }
                if (nextBgIndex > maxBgIndex) { nextBgIndex = 0; }
            });
            var profile = this.factory.createProfile();
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


