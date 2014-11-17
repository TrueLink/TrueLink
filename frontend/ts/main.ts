/// <reference path="typings/flux-react.d.ts"/>
/// <reference path="../vendor/typings/require/require.d.ts"/>
/// <reference path="../vendor/typings/es6-promises/es6-promises.d.ts"/>
/// <reference path="../vendor/typings/localforage/localforage.d.ts"/>
/// <reference path="../node_modules/invariant/invariant.d.ts"/>
/// <reference path="../node_modules/TlkeBuilder/TlkeBuilder.d.ts"/>
/// <reference path="../node_modules/TlhtBuilder/TlhtBuilder.d.ts"/>
/// <reference path="../node_modules/TlecBuilder/TlecBuilder.d.ts"/>
/// <reference path="../node_modules/Tlgr/Tlgr.d.ts"/>
/// <reference path="../node_modules/Tlht/Tlht.d.ts"/>
/// <reference path="../node_modules/Tlec/Tlec.d.ts"/>
/// <reference path="../node_modules/Tlke/Tlke.d.ts"/>
/// <reference path="../node_modules/SerializationContext/SerializationContext.d.ts"/>
/// <reference path="../node_modules/Route/Route.d.ts"/>
/// <reference path="../node_modules/Filter/Filter.d.ts"/>
/// <reference path="../node_modules/OverTlecBuilder/OverTlecBuilder.d.ts"/>
/// <reference path="../node_modules/modules/modules.d.ts"/>
/// <reference path="../node_modules/react-typescript-definitions/react.d.ts"/>
/// <reference path="../node_modules/forge-typescript-definitions/forge/forge.d.ts"/>
import Application = require("./models/App");
import AppComponent = require("./ui/AppComponent");
import Serializer = require("./serialization/serializer");
import query = require("./serialization/appQuery");
declare var realwindow;
import $=require("zepto");
import React = require("react");
import uuid = require("uuid");
import converters = require("Multivalue/converters");

    "use strict";


        //window.app = serializer.createApp();
        var serializer = new Serializer();
        serializer.init().then(function(){


        $(function () {
            converters.register();

            console.log(navigator.userAgent);

            var tabUuid = uuid(); 
            console.log("Setting tab killer with tabUuid ", tabUuid);
            realwindow.addEventListener("storage", function (e: StorageEvent) {
                if (e.key === "tab-uuid" && e.newValue !== tabUuid) {
                    console.log("Tab uuid has changed. Going to kill this tab.");
                    window.location.href = "data:text/html;charset=utf-8,"
                    + encodeURIComponent(
                        "<html>" 
                        + "  <head><title>x_x TrueLink άλφα</title></head>"
                        + "  <body>This TrueLink messenger tab was killed as another one was detected.</body>"
                        + "</html>");
                }
            });
            localStorage["tab-uuid"] = tabUuid; 

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
