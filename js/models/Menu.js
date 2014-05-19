define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var onChanged = require("mixins/onChanged");
    var fixedId = require("mixins/fixedId");
    var bind = require("mixins/bind");

    function Menu(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");
        this.fixedId = "0D7F92D8-8047-4E37-8E55-BCB009D541C8";
    }

    extend(Menu.prototype, eventEmitter, serializable, fixedId, onChanged, bind, {
        serialize: function (packet, context) {

        },
        deserialize: function (packet, context) {

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

        setApp: function (app) {
            this.app = app;
            app.off("changed", this._onAppChanged, this);
        },

        _onAppChanged: function () {
            this.onChanged();
        }

    });

    module.exports = Menu;
});