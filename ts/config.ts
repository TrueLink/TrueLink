
/// <reference path="../vendor/typings/require/require.d.ts"/>
require.config({
        baseUrl: "./lib",
        paths: {
            "zepto": "../vendor/zepto/src/zepto",
            "zepto_ajax": "../vendor/zepto/src/ajax",
            "zepto_event": "../vendor/zepto/src/event",
            "bind": "tools/bind",
            "uuid": "../vendor/uuid/uuid",
            "extend": "tools/extend",
            "modules": "../vendor/flux-modules/src",
            "react": "../vendor/react/build/react",
            "react-bootstrap": "../vendor/react-bootstrap/react-bootstrap",
            "localforage": "../vendor/localforage/localforage"
        },
        shim: {
            "zepto": { exports: "Zepto" },
            "zepto_ajax": { deps: ["zepto", "zepto_event"] },
            "zepto_event": { deps: ["zepto"] }
        }
    });
require(["main",
        "zepto_ajax",
        "converters/all",
    ]);
