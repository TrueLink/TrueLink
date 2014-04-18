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

    require(["modules/channels/tlke", "modules/channels/tlht", "tools/random", "modules/data-types/Hex", "modules/channels/Route",
        "zepto", "modules/channels/TestTransport"//, "react", "modules/TestApp", "components/channels/AppList", "modules/channels/contact"
        //"components/App", "components/LoginPage", "db", "services/crypto", "settings", "addons"
    ], function (Tlke, Tlht, random, Hex, Route, $, TestTransport, React, TestApp, AppList, Contact) {
        $(function () {

            var aliceTlke = new Tlke();
            var aliceTlht = new Tlht();
            var bobTlke = new Tlke();
            var bobTlht = new Tlht();

            var transport = new TestTransport();


            aliceTlke.setRng(random);
            bobTlke.setRng(random);
            aliceTlht.setRng(random);
            bobTlht.setRng(random);

            var aliceTlkeRoute = new Route();
            var aliceTlhtRoute = new Route();
            var bobTlkeRoute = new Route();
            var bobTlhtRoute = new Route();

            aliceTlke.on("offer", bobTlke.enterOffer, bobTlke);
            aliceTlke.on("auth", bobTlke.enterAuth, bobTlke);
            aliceTlke.on("addr", aliceTlkeRoute.setAddr, aliceTlkeRoute);
            aliceTlke.on("packet", aliceTlkeRoute.processPacket, aliceTlkeRoute);
            aliceTlht.on("packet", aliceTlhtRoute.processPacket, aliceTlhtRoute);
            aliceTlke.on("keyReady", function (args) {
                console.log("aliceTlke key generated: %s, in: %s, out: %s", args.key.as(Hex), args.inId.as(Hex), args.outId.as(Hex));
                aliceTlht.init(args.key);
                aliceTlhtRoute.setAddr(args); // interface is ok
                aliceTlht.generate();
            });


            aliceTlkeRoute.on("packet", aliceTlke.processPacket, aliceTlke);
            aliceTlhtRoute.on("packet", aliceTlht.processPacket, aliceTlht);
            aliceTlkeRoute.on("addrIn", transport.openAddr, transport);
            aliceTlhtRoute.on("addrIn", transport.openAddr, transport);

            aliceTlkeRoute.on("networkPacket", transport.sendNetworkPacket, transport);
            bobTlkeRoute.on("networkPacket", transport.sendNetworkPacket, transport);
            aliceTlhtRoute.on("networkPacket", transport.sendNetworkPacket, transport);
            bobTlhtRoute.on("networkPacket", transport.sendNetworkPacket, transport);

            transport.on("networkPacket", aliceTlkeRoute.processNetworkPacket, aliceTlkeRoute);
            transport.on("networkPacket", bobTlkeRoute.processNetworkPacket, bobTlkeRoute);
            transport.on("networkPacket", aliceTlhtRoute.processNetworkPacket, aliceTlhtRoute);
            transport.on("networkPacket", bobTlhtRoute.processNetworkPacket, bobTlhtRoute);

            bobTlkeRoute.on("packet", bobTlke.processPacket, bobTlke);
            bobTlhtRoute.on("packet", bobTlht.processPacket, bobTlht);
            bobTlkeRoute.on("addrIn", transport.openAddr, transport);
            bobTlhtRoute.on("addrIn", transport.openAddr, transport);

            bobTlke.on("addr", bobTlkeRoute.setAddr, bobTlkeRoute);
            bobTlke.on("packet", bobTlkeRoute.processPacket, bobTlkeRoute);
            bobTlht.on("packet", bobTlhtRoute.processPacket, bobTlhtRoute);
            bobTlke.on("keyReady", function (args) {
                console.log("bobTlke key generated:   %s, in: %s, out: %s", args.key.as(Hex), args.inId.as(Hex), args.outId.as(Hex));
                bobTlht.init(args.key);
                bobTlhtRoute.setAddr(args); // interface is ok
                bobTlht.generate();
            });

            bobTlht.on("htReady", function (args) {
                console.log("bob hashes ready:\tstart: %s, end: %s", args.hashStart.as(Hex), args.hashEnd.as(Hex));
            });
            aliceTlht.on("htReady", function (args) {
                console.log("alice hashes ready:\tstart: %s, end: %s", args.hashStart.as(Hex), args.hashEnd.as(Hex));
            });

            aliceTlke.generate();
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