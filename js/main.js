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

    require(["modules/channels/establishChannel", "modules/mockForChannels", "components/ChannelsTestPage", "tools/urandom", "zepto", "react"
        //"components/App", "components/LoginPage", "db", "services/crypto", "settings", "addons"
    ],
        function (Establish, ChannelStuff, ChannelsTestPage, urandom, $, React) {
            $(function () {

                var wrapper = new ChannelStuff();
                wrapper.stateChanged = update;
                var channels = {};
                var model = {};
                var page = ChannelsTestPage({
                    addChannel: createChannel,
                    channels: model,
                    generate: generate,
                    accept: accept,
                    acceptAuth: acceptAuth
                });

                function update() {
                    var newModel = {};
                    $.each(channels, function (key, channel) {
                        newModel[key] = wrapper.getInfo(channel);
                        newModel[key].name = key;
                    });
                    page.setProps({channels: newModel});
                }
                function createChannel() {
                    var name = urandom.name();
                    channels[name] = wrapper.createEstablishChannel();
                    update();
                }

                function generate(key) {
                    try {
                        channels[key].enterToken(new Establish.GenerateToken());
                    } catch (ex) {
                        console.error(ex);
                    }
                }

                function accept(key, offer) {
                    try {
                        channels[key].enterToken(new Establish.OfferToken(offer));
                    } catch (ex) {
                        console.error(ex);
                    }
                }

                function acceptAuth(key, auth, context) {
                    try {
                        channels[key].enterToken(new Establish.AuthToken(auth));
                        wrapper.removePrompt(context);
                    } catch (ex) {
                        console.error(ex);
                    }
                }

                React.renderComponent(page, document.body);

                //function startApp(rootEntity, rootData) {
                //    settings.set("root", rootData);
                //    db.init(rootEntity);
                //    React.renderComponent(App({rootEntity: rootEntity}), document.body);
                //}
                //React.renderComponent(LoginPage({login: startApp, db: db, crypto: crypto, rootData: settings.get("root")}), document.body);
            });
        });
}(require, window.document));