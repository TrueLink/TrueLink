define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var fixedId = require("mixins/fixedId");
    var bind = require("mixins/bind");

    function Menu() {
        this.fixedId = "0D7F92D8-8047-4E37-8E55-BCB009D541C8";
        this._defineEvent("changed");
        this._defineEvent("currentProfileChanged");
        this._defineEvent("addProfile");
        this.app = null;
    }

    extend(Menu.prototype, eventEmitter, serializable, fixedId, model, bind, {

        setApp: function (app) {
            if (this.app) {
                this.app.off("changed", this._onAppChanged, this);
            }
            app.on("changed", this._onAppChanged, this);
            this.app = app;
        },
        serialize: function (packet, context) {

        },
        deserialize: function (packet, context) {

        },

        getCurrentProfile: function () {
            this._checkApp();
            return this.app.getCurrentProfile();
        },

        setCurrentProfile: function (profile) {
            this.fire("currentProfileChanged", profile);
        },

        getProfiles: function () {
            this._checkApp();
            return this.app.getProfiles();
        },

        addProfile: function () {
            this._checkApp();
            this.fire("addProfile");
        },

        _checkApp: function () {
            invariant(this.app, "app is not set");
        },

        _onAppChanged: function () {
            // everything will be reconstructed anyway on app "changed"
            this.onChanged();
        }

    });

    module.exports = Menu;
});