(function (require) {
    "use strict";
    require.config({
        baseUrl: "/js",
        paths: {
            "zepto": "../vendor/zepto/src/zepto",
            "zepto_ajax": "../vendor/zepto/src/ajax",
            "zepto_event": "../vendor/zepto/src/event",
            "bind": "tools/bind",
            "uuid": "tools/uuid",
            "extend": "tools/extend",
            "modules": "../vendor/flux-modules/src",
            "react": "../vendor/react/build/react"
        },
        shim: {
            "zepto": { exports: "Zepto" },
            "zepto_ajax": { deps: ["zepto", "zepto_event"] },
            "zepto_event": { deps: ["zepto"] }
        }
    });

    require([
        "zepto",
        "zepto_ajax",
        "converters/all",
        "models/App",
        "serialization/appQuery",
        "serialization/serializer",
        "ui/AppComponent",
        "react"
    ], function () {

        var $ = require("zepto");
        var Application = require("models/App");
        var query = require("serialization/appQuery");
        var Serializer = require("serialization/serializer");

        var AppComponent = require("ui/AppComponent");
        var React = require("react");

        var serializer = new Serializer();

        window.app = serializer.createApp();

        $(function () {
            console.log(navigator.userAgent);
            console.log("Starting app...");
            var counterObj = {
                dataLength: 0,
                linkCount: 0,
                objCount: 0
            };
            var appPacket = serializer.createPacket(query, "Application", Application.id, null, counterObj), app;
            if (appPacket) {
                app = serializer.deserialize(appPacket, serializer.createApp, serializer);
                console.log("app deserialized: %s objects (~%s KB), %s links", counterObj.objCount, (counterObj.dataLength / 1024.0).toFixed(2), counterObj.linkCount);
            } else {
                app = serializer.createApp();
                app.init();
            }

            React.renderComponent(AppComponent({model: app}), document.body);

        });
    });
}(require));