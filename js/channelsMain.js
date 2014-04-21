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

    require(["modules/channels/tlkeBuilder", "modules/channels/tlhtBuilder", "modules/channels/tlecBuilder", "tools/random", "modules/data-types/Hex", "modules/channels/Route",
        "zepto", "modules/channels/TestTransport", "modules/data-types/utf8string"
    ], function (TlkeBuilder, TlhtBuilder, TlecBuilder, random, Hex, Route, $, TestTransport, Utf8String) {
        $(function () {
            var transport = new TestTransport();
            var aliceTlkeb = new TlkeBuilder(transport, random);
            var bobTlkeb = new TlkeBuilder(transport, random);
            var aliceTltheb = new TlhtBuilder(transport, random);
            var bobTlhteb = new TlhtBuilder(transport, random);
            var aliceTlecb = new TlecBuilder(transport, random);
            var bobTlecb = new TlecBuilder(transport, random);


            aliceTlkeb.on("offer", bobTlkeb.enterOffer, bobTlkeb);
            aliceTlkeb.on("auth", function (auth) {
                if (auth) {
                    bobTlkeb.enterAuth(auth);
                }
            }, null);

            aliceTlkeb.on("done", aliceTltheb.build, aliceTltheb);
            aliceTltheb.on("done", aliceTlecb.build, aliceTlecb);
            bobTlkeb.on("done", bobTlhteb.build, bobTlhteb);
            bobTlhteb.on("done", bobTlecb.build, bobTlecb);


            window.str = Utf8String;
            aliceTlecb.on("done", function (args) {
                window.alice = args;
                window.alice.on("message", function (msg) {
                    console.log(msg.as(Utf8String), "to alice");
                });
            });
            bobTlecb.on("done", function (args) {
                window.bob = args;
                window.bob.on("message", function (msg) {
                    console.log(msg.as(Utf8String), "to bob");
                });
            });

            aliceTlkeb.build();
            bobTlkeb.build();
            aliceTlkeb.generate();
//            var apps = {};
//            function addApp(id, isSync) {
//                apps[id] = new TestApp(id, isSync);
//                apps[id].stateChanged = updateView;
//                if (isSync) {
//                    apps[id].addSync(true);
//                }
//                updateView();
//            }
//
//            function updateView() {
//                var models = {};
//                $.each(apps, function (id, app) {
//                    models[id] = createAppModel(app, id);
//                });
//                list.setProps({apps: models});
//            }
//
//            function createAppModel(app, id) {
//                var contactList = {};
//                app.contacts.items().forEach(function (item) {
//                    var name = item.value.name;
//                    var contact = item.key;
//                    contactList[name] = {
//                        channelsData: [],
//                        startSync: function () {
//                            throw new Error("not implemented");
//                        },
//                        generateTlke: contact.generateTlke.bind(contact),
//                        acceptTlkeOffer: contact.acceptTlkeOffer.bind(contact),
//                        acceptTlkeAuth: contact.acceptTlkeAuth.bind(contact),
//                        sendTextMessage: contact.sendUserMessage.bind(contact),
//                        generateNewChannel: contact.generateNewChannel.bind(contact),
//
//                        lastError: contact.lastError,
//                        lastLevel2ChannelState: contact.lastLevel2ChannelState,
//                        state: contact.state,
//                        prompts: contact.prompts,
//                        messages: contact.messages
//                    };
//                });
//                return {
//                    id: id,
//                    contactList: contactList,
//                    addContact: app.addContact.bind(app),
//                    addSync: app.addSync.bind(app),
//                    currentContactName: app.getLastContactName()
//                };
//            }
//
//            var list = AppList({apps: {}, add: addApp});
//            React.renderComponent(list, document.body);

            //function startApp(rootEntity, rootData) {
            //    settings.set("root", rootData);
            //    db.init(rootEntity);
            //    React.renderComponent(App({rootEntity: rootEntity}), document.body);
            //}
            //React.renderComponent(LoginPage({login: startApp, db: db, crypto: crypto, rootData: settings.get("root")}), document.body);
        });
    });
}(require, window.document));