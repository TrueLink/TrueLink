/// <reference path="typings/flux-react.d.ts"/>
/// <reference path="../vendor/typings/require/require.d.ts"/>
/// <reference path="../vendor/typings/es6-promises/es6-promises.d.ts"/>
/// <reference path="../vendor/typings/localforage/localforage.d.ts"/>
import Application = require("./models/App");
import AppComponent = require("ui/AppComponent");
import Serializer = require("serialization/serializer");
import query = require("serialization/appQuery");
import $ = require("zepto");
import React = require("react");
    "use strict";

        //window.app = serializer.createApp();
        var serializer = new Serializer();
        serializer.init().then(function(){


        $(function () {
            console.log(navigator.userAgent);
            console.log("Starting app...");
            var counterObj = {
                dataLength: 0,
                linkCount: 0,
                objCount: 0
            };
            var appPacket = serializer.createPacket(query, "Application", Application.Application.id, null, counterObj), app;
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
