(function (require, document) {
    "use strict";
    require.config({
        baseUrl: "/js",
        paths: {
            "react": "lib/react",
            "zepto": "lib/zepto",
            "zepto_fx": "lib/zepto.fx",
            "q": "lib/q",
            "es5": "lib/es5-shim.min",
            "whenAll": "tools/resolve"
        },
        shim: {
            "zepto": { exports: "Zepto" },
            "zepto_fx": { deps: ["zepto"] }
        }
    });

    require(["zepto", "react", "components/App", "zepto_fx", "whenAll"], function ($, React, App) {
        $(function () {
            React.renderComponent(App(), document.body);
        });
    });
}(require, window.document));