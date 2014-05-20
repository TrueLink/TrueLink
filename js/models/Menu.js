define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var model = require("mixins/model");
    var fixedId = require("mixins/fixedId");
    var bind = require("mixins/bind");

    function Menu(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");
        this.fixedId = "0D7F92D8-8047-4E37-8E55-BCB009D541C8";
        this.app = null;
    }

    extend(Menu.prototype, eventEmitter, serializable, fixedId, model, bind, {
        serialize: function (packet, context) {
            console.log("serializing Menu (NOP)");
        },
        deserialize: function (packet, context) {
            console.log("deserializing Menu (NOP)");
        },

        getCurrentProfile: function () {
            return this.app.getCurrentProfile();
        },

        setCurrentProfile: function (profile) {
            this.app.setCurrentProfile(profile);
        },

        getProfiles: function () {
            return this.app.getProfiles();
        },

        addProfile: function () {
            this.app.addProfile();
        },

        navigate: function (pageName, pageModel) {
            this.app.router.navigate(pageName, pageModel);
        },

        setApp: function (app) {
            this.app = app;
            app.on("changed", this._onAppChanged, this);
        },

        _onAppChanged: function () {
            this.onChanged();
        }

    });

    module.exports = Menu;
});