    "use strict";
    import modules = require("modules");
    import invariant = require("../../../modules/invariant");
    import extend = require("../../tools/extend");
    import prototype = require("./prototype");

    import Router = require("../../models/Router");
    var Random = modules.cryptography.random;
    import Menu = require("../../models/Menu");
    import Profile = require("../../models/Profile");

    import ProfileFactory = require("./profileFactory");
    import RouterFactory = require("./routerFactory");

    function AppFactory(serializer, app) {
        invariant(serializer, "Can i haz serializer?");
        invariant(app, "Can i haz app?");
        this.app = app;
        this.serializer = serializer;
    }

    extend(AppFactory.prototype, prototype, {
        createProfile: function () {
            var profile = new Profile.Profile();
            var profileFactory = new ProfileFactory(this.serializer, profile);
            profile.setFactory(profileFactory);
            profile.setApp(this.app);
            return this._observed(profile);
        },

        _createRouter: function () {
            var router = new (<any>Router)(this);
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
            return this.getInstance("Random", this._createRandom, this);
        },

        createMenu: function () {
            var menu = new Menu.Menu();
            menu.setFactory(this);
            menu.setApp(this.app);
            return this._observed(menu);
        }
    });

    export = AppFactory;
