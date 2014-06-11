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

        createTransport: function () {
            if (!this.transport) {
                this.transport = this._observed(new CouchTransport(this));
            }
            return this.transport;
        },
        createRouter: function () {
            if (!this.router) {
                var router = new Router(this);
                var routerFactory = new RouterFactory(this.serializer, router);
                router.setFactory(routerFactory);
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
            var menu = new Menu();
            menu.setFactory(this);
            menu.setApp(this.app);
            return this._observed(menu);
        }
    });

    module.exports = AppFactory;
});