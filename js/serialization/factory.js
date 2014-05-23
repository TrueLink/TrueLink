define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var Dictionary = require("modules/dictionary/dictionary");

    var resolver = new Dictionary();

    var App = require("models/App");
    var Router = require("models/Router");
    var CouchTransport = require("models/CouchTransport");
    var Menu = require("models/Menu");
    var Profile = require("models/Profile");
    var Document = require("models/Document");
    var Contact = require("models/Contact");
    var Dialog = require("models/Dialog");
    var ContactTlConnection = require("models/TlConnection");

    // types that can be deserialized by typeData
    resolver.item(0, App);
    resolver.item(1, Profile);
    resolver.item(2, Document);
    resolver.item(3, Contact);
    resolver.item(4, Dialog);

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
        createProfile: function (app) {
            return this._observed(new Profile(this, app));
        },
        createDocument: function (profile) {
            return this._observed(new Document(this, profile));
        },
        createContact: function (profile) {
            return this._observed(new Contact(this, profile));
        },
        createDialog: function (profile) {
            return this._observed(new Dialog(this, profile));
        },

        createContactTlConnection: function (contact) {
            return this._observed(new ContactTlConnection(this, contact));
        },
        getTransport: function () {
            if (!this.transport) {
                this.transport = this._observed(new CouchTransport(this));
            }
            return this.transport;
        },

        createRouter: function () {
            if (!this.router) {
                this.router = this._observed(new Router(this));
            }
            return this.router;
        },

        createMenu: function (app) {
            return this._observed(new Menu(this, app));
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