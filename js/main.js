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

    require(["modules/channels/tlkeHandshakeChannel", "modules/mockForChannels", "components/ChannelsTestPage", "tools/urandom", "zepto", "react"
        //"components/App", "components/LoginPage", "db", "services/crypto", "settings", "addons"
    ],
        function (TlkeHandshakeChannel, MockForChannels, ChannelsTestPage, urandom, $, React) {
            $(function () {

                var wrapper = new MockForChannels();
                wrapper.stateChanged = onChannelsChanged;
                var tlkeHandshakesInProgress = {};
                var chatChannels = {};
                var page = ChannelsTestPage({
                    addChannel: createTlkeHandshakeChannel,
                    tlkeHandshakesInProgress: {},
                    chatChannels: {},
                    generate: generate,
                    accept: accept,
                    acceptAuth: acceptAuth,
                    sendTextMessage: sendTextMessage
                });

                // mock will call this when it's time to rerender channels in ui
                function onChannelsChanged() {
                    var newModel = {chatChannels: {}, tlkeHandshakesInProgress: {}};
                    $.each(tlkeHandshakesInProgress, function (key, channel) {
                        newModel.tlkeHandshakesInProgress[key] = wrapper.getChannelInfo(channel);
                        newModel.tlkeHandshakesInProgress[key].name = key;
                    });
                    $.each(chatChannels, function (key, channel) {
                        newModel.chatChannels[key] = wrapper.getChannelInfo(channel);
                        newModel.chatChannels[key].name = key;
                    });
                    page.setProps(newModel);
                }
                function createTlkeHandshakeChannel() {
                    var name = urandom.name();
                    tlkeHandshakesInProgress[name] = wrapper.createTlkeHandshakeChannel();
                    wrapper.addPromptListener(tlkeHandshakesInProgress[name], function (token, context) {
                        if (token instanceof TlkeHandshakeChannel.NewChannelToken) {
                            chatChannels[name] = wrapper.createChatChannel();
                            chatChannels[name].enterToken(token);
                        }
                    });
                    update();
                }

                function generate(key) {
                    try {
                        tlkeHandshakesInProgress[key].enterToken(new TlkeHandshakeChannel.GenerateToken());
                    } catch (ex) {
                        console.error(ex);
                    }
                }

                function accept(key, offer) {
                    try {
                        tlkeHandshakesInProgress[key].enterToken(new TlkeHandshakeChannel.OfferToken(offer));
                    } catch (ex) {
                        console.error(ex);
                    }
                }

                function acceptAuth(key, auth, context) {
                    try {
                        tlkeHandshakesInProgress[key].enterToken(new TlkeHandshakeChannel.AuthToken(auth));
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