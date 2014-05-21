(function (require) {
    "use strict";
    require.config({
        baseUrl: "/vendor/flux-modules/src",
        paths: {
            "zepto": "../../zepto/src/zepto",
            "bind": "../../../../js/tools/bind",
            "uuid": "../../../../js/tools/uuid",
            "extend": "../../../../js/tools/extend",
            "js": "../../../../js",
            "ui": "../../../../js/ui",
            "tools": "../../../../js/tools",
            "mixins": "../../../../js/mixins",
            "invariant": "invariant/invariant",
            "urandom": "urandom/urandom",
            "dictionary": "dictionary/dictionary",
            "react": "../../react/build/react"
        },
        shim: {
            "zepto": { exports: "Zepto" }
        }
    });

    require([
        "zepto",
        "js/converters/all",
        "js/models/App",
        "js/serialization/factory",
        "js/serialization/appQuery",
        "js/serialization/serializer",
        "ui/AppComponent",
        "react"
    ], function () {

        var $ = require("zepto");
        var Application = require("js/models/App");
        var Factory = require("js/serialization/factory");
        var query = require("js/serialization/appQuery");
        var serializer = require("js/serialization/serializer");

        var AppComponent = require("ui/AppComponent");
        var React = require("react");

        $(function () {
            console.log(navigator.userAgent);
            console.log("Starting app...");
            var factory = new Factory(serializer);
            var appPacket = serializer.createPacket(Application.id, query), app;
            if (appPacket) {
                app = serializer.deserialize(appPacket, factory.createApp.bind(factory));
            } else {
                app = factory.createApp();
                app.init();
            }

            React.renderComponent(AppComponent({model: app}), document.body);

        });
    });
}(require));