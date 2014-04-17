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

    require(["modules/channels/tlke", "tools/random", "modules/data-types/Hex", "modules/channels/Route",
        "zepto"//, "react", "modules/TestApp", "components/channels/AppList", "modules/channels/contact"
        //"components/App", "components/LoginPage", "db", "services/crypto", "settings", "addons"
    ], function (Tlke, random, Hex, Route, $, React, TestApp, AppList, Contact) {
        $(function () {

            var alice = new Tlke();
            var bob = new Tlke();

//            alice.on("changeState");
//            alice.on("dirty");
            alice.setRng(random);
            bob.setRng(random);

            var aliceRoute = new Route();
            var bobRoute = new Route();

            alice.on("offer", bob.enterOffer, bob);
            alice.on("auth", bob.enterAuth, bob);
            alice.on("addr", aliceRoute.setAddr, aliceRoute);
            alice.on("packet", bob.processPacket, bob);
            alice.on("keyReady", function (args) {console.log("alice key generated:\t%s, in: %s, out: %s", args.key.as(Hex), args.inId.as(Hex), args.outId.as(Hex)); });


            bob.on("addr", function (args) {console.log("bob generated addr:\tin: %s, out: %s", args.inId.as(Hex), args.outId.as(Hex)); });
            bob.on("packet", alice.processPacket, alice);
            bob.on("keyReady", function (args) {console.log("bob key generated:\t%s, in: %s, out: %s", args.key.as(Hex), args.inId.as(Hex), args.outId.as(Hex)); });

            alice.generate();
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