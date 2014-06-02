define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var Dictionary = require("modules/dictionary/dictionary");
    var extend = require("extend");
    var prototype = require("./prototype");

    var Router = require("models/Router");
    var CouchTransport = require("models/tlConnection/CouchTransport");
    var Random = require("modules/cryptography/random");
    var Menu = require("models/Menu");
    var Profile = require("models/Profile");

    var ProfileFactory = require("./profileFactory");
    var RouterFactory = require("./routerFactory");

    function AppFactory(serializer) {
        invariant(serializer, "Can i haz serializer?");
        this.serializer = serializer;
        this.app = null;
    }

    extend(AppFactory.prototype, prototype, {
        setApp: function (app) {
            this.app = app;
        },

        createProfileFactory: function (profile) {
            var profileFactory = new ProfileFactory(this.serializer);
            profileFactory.setProfile(profile);
            return profileFactory;
        },
        createProfile: function () {
            invariant(this.app, "app is not set");
            var profile = new Profile();
            profile.setFactory(this.createProfileFactory(profile));
            profile.setApp(this.app);
            return this._observed(profile);
        },

        createTransport: function () {
            if (!this.transport) {
                this.transport = this._observed(new CouchTransport(this));
            }
            return this.transport;
        },

        createRouterFactory: function (router) {
            var routerFactory = new RouterFactory(this.serializer);
            routerFactory.setRouter(router);
            return routerFactory;
        },
        createRouter: function () {
            if (!this.router) {
                var router = new Router(this);
                router.setFactory(this.createRouterFactory(router));
                this.router = this._observed(router);
            }
            return this.router;
        },

        createRandom: function () {
            if (!this.random) {
                this.random = this._observed(new Random(this));
            }
            return this.random;
        },

        createMenu: function () {
            invariant(this.app, "app is not set");
            var menu = new Menu();
            menu.setFactory(this);
            menu.setApp(this.app);
            return this._observed(menu);
        }
    });

    module.exports = AppFactory;
});