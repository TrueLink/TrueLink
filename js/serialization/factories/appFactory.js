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
            var profile = new Profile(this);
            profile.factory = this.createProfileFactory(profile);
            profile.app = this.app;
            return this._observed(profile);
        },


        construct: function (Constructor) {
            if (Constructor === CouchTransport) {
                return this.createTransport();
            }
            if (Constructor === Router) {
                return this.createRouter();
            }
            if (Constructor === Random) {
                return this.createRandom();
            }
            return this._observed(new Constructor(this));
        },

        createTransport: function () {
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

        createRandom: function () {
            if (!this.random) {
                this.random = this._observed(new Random(this));
            }
            return this.random;
        },

        createMenu: function () {
            invariant(this.app, "app is not set");
            return this._observed(new Menu(this, this.app));
        }
    });

    module.exports = AppFactory;
});