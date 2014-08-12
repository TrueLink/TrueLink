
/// <reference path="../vendor/typings/require/require.d.ts"/>
require.config({
        baseUrl: "/binjs",
        paths: {
            "zepto": "../vendor/zepto/src/zepto",
            "zepto_ajax": "../vendor/zepto/src/ajax",
            "zepto_event": "../vendor/zepto/src/event",
            "bind": "tools/bind",
            "uuid": "../vendor/uuid/uuid",
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
require(["main",
        "zepto_ajax",
        "converters/all",
    ]);
