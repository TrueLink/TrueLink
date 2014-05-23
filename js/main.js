(function (require) {
    "use strict";
    require.config({
        baseUrl: "/js",
        paths: {
            "zepto": "../vendor/zepto/src/zepto",
            "bind": "tools/bind",
            "uuid": "tools/uuid",
            "extend": "tools/extend",
            "modules": "../vendor/flux-modules/src/",
            "react": "../vendor/react/build/react"
        },
        shim: {
            "zepto": { exports: "Zepto" }
        }
    });

    require([
        "zepto",
        "converters/all",
        "models/App",
        "serialization/factory",
        "serialization/appQuery",
        "serialization/serializer",
        "ui/AppComponent",
        "react"
    ], function () {

        var $ = require("zepto");
        var Application = require("models/App");
        var Factory = require("serialization/factory");
        var query = require("serialization/appQuery");
        var serializer = require("serialization/serializer");

        var AppComponent = require("ui/AppComponent");
        var React = require("react");

        $(function () {
            console.log(navigator.userAgent);
            console.log("Starting app...");
            var factory = new Factory(serializer);
            var counterObj = {
                dataLength: 0,
                linkCount: 0
            };
            var appPacket = serializer.createPacket(Application.id, query, null, counterObj), app;
            if (appPacket) {
                app = serializer.deserialize(appPacket, factory.createApp.bind(factory));
                console.log("app deserialized: ~%s KB, %s links", (counterObj.dataLength / 1024.0).toFixed(2), counterObj.linkCount);
            } else {
                app = factory.createApp();
                app.init();
            }

            React.renderComponent(AppComponent({model: app}), document.body);

        });
    });
}(require));