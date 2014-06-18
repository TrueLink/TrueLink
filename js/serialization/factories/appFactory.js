define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var prototype = require("./prototype");

    var Router = require("models/Router");
    var CouchTransport = require("models/tlConnection/CouchTransport");
    var Random = require("modules/cryptography/random");
    var Menu = require("models/Menu");
    var Profile = require("models/Profile");

    var ProfileFactory = require("./profileFactory");
    var RouterFactory = require("./routerFactory");

    function AppFactory(serializer, app) {
        invariant(serializer, "Can i haz serializer?");
        invariant(app, "Can i haz app?");
        this.app = app;
        this.serializer = serializer;
    }

    extend(AppFactory.prototype, prototype, {
        createProfile: function () {
            var profile = new Profile();
            var profileFactory = new ProfileFactory(this.serializer, profile);
            profile.setFactory(profileFactory);
            profile.setApp(this.app);
            return this._observed(profile);
        },

        _createTransport: function () {
            return this._observed(new CouchTransport());
        },
        createTransport: function () {
            return this.getInstance("Transport", this._createTransport, this);
        },
        _createRouter: function () {
            var router = new Router(this);
            var routerFactory = new RouterFactory(this.serializer, router);
            router.setFactory(routerFactory);
            return this._observed(router);
        },
        createRouter: function () {
            return this.getInstance("Router", this._createRouter, this);
        },

        _createRandom: function () {
            return this._observed(new Random(this));
        },
        createRandom: function () {
            return this.getInstance("Random", this._createRouter, this);
        },

        createMenu: function () {
            var menu = new Menu();
            menu.setFactory(this);
            menu.setApp(this.app);
            return this._observed(menu);
        }
    });

    module.exports = AppFactory;
});