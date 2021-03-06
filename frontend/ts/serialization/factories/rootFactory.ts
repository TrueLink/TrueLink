    "use strict";
    import modules = require("modules");
    import invariant = require("invariant");
    import extend = require("../../tools/extend");
    import prototype = require("./prototype");
    import AppFactory = require("./appFactory");

    import App = require("../../models/App");

    function Factory(serializer) {
        invariant(serializer, "Can i haz serializer?");
        this.serializer = serializer;
    }

    extend(Factory.prototype, prototype, {
        createApp: function () {
            var app = new App.Application();
            var appFactory = new AppFactory(this.serializer, app);
            app.setFactory(appFactory);
            return this._observed(app);
        }
    });

    export = Factory;
