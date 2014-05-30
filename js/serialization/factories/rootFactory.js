define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var prototype = require("./prototype");
    var AppFactory = require("./appFactory");

    var App = require("models/App");

    function Factory(serializer) {
        invariant(serializer, "Can i haz serializer?");
        this.serializer = serializer;
    }

    extend(Factory.prototype, prototype, {
        createApp: function () {
            var appFactory = new AppFactory(this.serializer);
            var app = new App(appFactory);
            appFactory.setApp(app);
            return app;
        },
        createAppFactory: function (app) {
            var factory = new AppFactory(this.serializer);
            factory.setApp(app);
            return factory;
        }
    });

    module.exports = Factory;
});