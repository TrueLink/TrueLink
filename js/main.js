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
        function (EstablishChannel, ChannelStuff, ChannelsTestPage, urandom, $, React) {
            $(function () {

                var wrapper = new ChannelStuff();
                wrapper.stateChanged = update;
                var establishChannels = {};
                var chatChannels = {};
                var page = ChannelsTestPage({
                    addChannel: createEstablishChannel,
                    establishChannels: {},
                    chatChannels: {},
                    generate: generate,
                    accept: accept,
                    acceptAuth: acceptAuth,
                    sendTextMessage: sendTextMessage
                });

                function update() {
                    var newModel = {chatChannels: {}, establishChannels: {}};
                    $.each(establishChannels, function (key, channel) {
                        newModel.establishChannels[key] = wrapper.getChannelInfo(channel);
                        newModel.establishChannels[key].name = key;
                    });
                    $.each(chatChannels, function (key, channel) {
                        newModel.chatChannels[key] = wrapper.getChannelInfo(channel);
                        newModel.chatChannels[key].name = key;
                    });
                    page.setProps(newModel);
                }
                function createEstablishChannel() {
                    var name = urandom.name();
                    establishChannels[name] = wrapper.createEstablishChannel();
                    wrapper.addPromptListener(establishChannels[name], function (token, context) {
                        if (token instanceof EstablishChannel.NewChannelToken) {
                            chatChannels[name] = wrapper.createChatChannel();
                            chatChannels[name].enterToken(token);
                        }
                    });
                    update();
                }

                function generate(key) {
                    try {
                        establishChannels[key].enterToken(new EstablishChannel.GenerateToken());
                    } catch (ex) {
                        console.error(ex);
                    }
                }

                function accept(key, offer) {
                    try {
                        establishChannels[key].enterToken(new EstablishChannel.OfferToken(offer));
                    } catch (ex) {
                        console.error(ex);
                    }
                }

                function acceptAuth(key, auth, context) {
                    try {
                        establishChannels[key].enterToken(new EstablishChannel.AuthToken(auth));
                        wrapper.removePrompt(context);
                    } catch (ex) {
                        console.error(ex);
                    }
                }

                function sendTextMessage(key, messageData) {
                    try {
                        // to append this message to a sender channel as my message
                        wrapper.processMessage(chatChannels[key], messageData);
                        chatChannels[key].sendMessage(messageData);
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