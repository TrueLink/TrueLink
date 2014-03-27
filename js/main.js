(function (require, document) {
    "use strict";
    require.config({
        baseUrl: "/js",
        paths: {
            "react": "lib/react",
            "zepto": "lib/zepto",
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
        "zepto", "react", "modules/TestApp", "components/channels/AppList", "modules/channels/syncContactChannelGroup"
        //"components/App", "components/LoginPage", "db", "services/crypto", "settings", "addons"
    ], function ($, React, TestApp, AppList, SyncContactChannelGroup) {
        $(function () {


            var apps = {};
            function addApp(id) {
                apps[id] = new TestApp(id);
                apps[id].stateChanged = updateView;
                updateView();
            }

            function updateView() {
                var models = {};
                $.each(apps, function (id, app) {
                    models[id] = createAppModel(app, id);
                });
                list.setProps({apps: models});
            }

            function createAppModel(app, id) {
                var contactList = {};


                app.data.each(function (chGroup, data) {
                    contactList[data.name] = $.extend({
                        generateTlke: app.generateTlkeFor.bind(app, chGroup),
                        isSync: chGroup instanceof SyncContactChannelGroup
                    }, data);
                });
                return {
                    id: id,
                    contactList: contactList,
                    addContact: app.addContact.bind(app)
                };
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