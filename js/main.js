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
        "zepto", "react", "modules/TestApp", "components/channels/AppList", "modules/channels/contact"
        //"components/App", "components/LoginPage", "db", "services/crypto", "settings", "addons"
    ], function ($, React, TestApp, AppList, Contact) {
        $(function () {


            var apps = {};
            function addApp(id, isSync) {
                apps[id] = new TestApp(id, isSync);
                apps[id].stateChanged = updateView;
                if (isSync) {
                    apps[id].addSync(true);
                }
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
                app.contacts.items().forEach(function (item) {
                    var name = item.value.name;
                    var contact = item.key;
                    contactList[name] = {
                        channelsData: [],
                        startSync: function () {
                            throw new Error("not implemented");
                        },
                        generateTlke: contact.generateTlke.bind(contact),
                        acceptTlkeOffer: contact.acceptTlkeOffer.bind(contact),
                        acceptTlkeAuth: contact.acceptTlkeAuth.bind(contact),
                        sendTextMessage: contact.sendUserMessage.bind(contact),
                        generateNewChannel: contact.generateNewChannel.bind(contact),

                        lastError: contact.lastError,
                        lastLevel2ChannelState: contact.lastLevel2ChannelState,
                        state: contact.state,
                        prompts: contact.prompts,
                        messages: contact.messages
                    };
                });
                return {
                    id: id,
                    contactList: contactList,
                    addContact: app.addContact.bind(app),
                    addSync: app.addSync.bind(app),
                    currentContactName: app.getLastContactName()
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