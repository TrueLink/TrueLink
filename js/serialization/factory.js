define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var Dictionary = require("dictionary");

    var resolver = new Dictionary();

    var App = require("js/models/App");
    var Router = require("js/models/Router");
    var Transport = require("js/models/Transport");
    var Menu = require("js/models/Menu");
    var Profile = require("js/models/Profile");

    // types that can be deserialized by typeData
    resolver.item(0, App);
    resolver.item(1, Profile);

    function Factory(serializer) {
        invariant(serializer, "serializer must be provided");
        this.serializer = serializer;
        this.transport = null;
        this.router = null;
    }

    Factory.prototype = {
        createApp: function () {
            return this._observed(new App(this));
        },
        createProfile: function () {
            return this._observed(new Profile(this));
        },
        createTransport: function () {
            if (!this.transport) {
                this.transport = this._observed(new Transport(this));
            }
            return this.transport;
        },

        createRouter: function () {
            if (!this.router) {
                this.router = this._observed(new Router(this));
            }
            return this.router;
        },

        createMenu: function () {
            return this._observed(new Menu(this));
        },

        _observed: function (obj) {
            this.serializer.listen(obj);
            return obj;
        },

        getConstructor: function (typeData) {
            var constructor = resolver.item(typeData);
            invariant(constructor, "Type with data %s is not registered", typeData);
            // will be bound inside parent caller's deserialization method
            return function () { return this._observed(new constructor(this)); };
        },

        getTypeData: function (inst) {
            var found = resolver.first(function (item) { return item.value === inst.constructor; });
            invariant(found, "Type is not registered");
            return found.key;
        }
    };

    module.exports = Factory;
});