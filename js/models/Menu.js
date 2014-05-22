define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var fixedId = require("mixins/fixedId");
    var bind = require("mixins/bind");

    function Menu(factory, app) {
        invariant(factory, "Can be constructed only with factory");
        invariant(app, "Can i haz app?");
        this.factory = factory;
        this._defineEvent("changed");
        this.fixedId = "0D7F92D8-8047-4E37-8E55-BCB009D541C8";
        this.app = app;
        app.on("changed", this._onAppChanged, this);
    }

    extend(Menu.prototype, eventEmitter, serializable, fixedId, model, bind, {
        serialize: function (packet, context) {
            //console.log("serializing Menu (NOP)");
        },
        deserialize: function (packet, context) {
            //console.log("deserializing Menu (NOP)");
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

        _onAppChanged: function () {
            this.onChanged();
        }

    });

    module.exports = Menu;
});