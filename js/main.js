(function (require, document) {
    "use strict";
    require.config({
        baseUrl: "/js",
        paths: {
            "react": "lib/react",
            "zepto": "lib/zepto.min",
            "zepto_fx": "lib/zepto.fx",
            "q": "lib/q",
            "es5Shim": "lib/es5-shim.min",
            "idbShim": "lib/idb-shim.min",
            "dbJs": "lib/db",
            "whenAll": "tools/resolve",
            "linkDb": "modules/linkDb",
            "bind": "tools/bind",
            "db": "services/db",
            "settings": "services/settings"
        },
        shim: {
            "zepto": { exports: "Zepto" },
            "zepto_fx": { deps: ["zepto"] }
        }
    });

    define("addons", ["zepto_fx", "lib/es5-shim.min", "lib/idb-shim.min", "tools/resolve"], function () {});

    require([
        "zepto", "react", "modules/TestApp", "components/channels/AppList"
        //"components/App", "components/LoginPage", "db", "services/crypto", "settings", "addons"
    ], function ($, React, TestApp, AppList) {
        $(function () {


            var apps = {};
            function addApp(name) {
                apps[name] = new TestApp(name);
                apps[name].stateChanged = updateView;
                updateView();
            }

            function updateView() {
                list.setProps({apps: apps});
            }

            var list = AppList({apps: {}, add: addApp});
            React.renderComponent(list, document.body);

            //function startApp(rootEntity, rootData) {
            //    settings.set("root", rootData);
            //    db.init(rootEntity);
            //    React.renderComponent(App({rootEntity: rootEntity}), document.body);
            //}
            //React.renderComponent(LoginPage({login: startApp, db: db, crypto: crypto, rootData: settings.get("root")}), document.body);
        });
    });
}(require, window.document));