define([
    "modules/channels/tlkeHandshakeChannel", "modules/mockForChannels", "components/ChannelsTestPage", "tools/urandom", "zepto", "react"
], function (TlkeHandshakeChannel, MockForChannels, ChannelsTestAppPage, urandom, $, React) {
    "use strict";

    function App(id) {

        this.stateChanged = function () {};

        this.wrapper = new MockForChannels(id);
        this.wrapper.stateChanged = this.onChannelsChanged.bind(this);
        this.model = {tlkeHandshakesInProgress: {}, chatChannels: {}};
        this.tlkeHandshakesInProgress = {};
        this.chatChannels = {};
    }

    App.prototype = {
        getProps: function () {
            return {
                addChannel: this.createTlkeHandshakeChannel.bind(this),
                tlkeHandshakesInProgress: this.model.tlkeHandshakesInProgress,
                chatChannels: this.model.chatChannels,
                generate: this.generate.bind(this),
                accept: this.accept.bind(this),
                acceptAuth: this.acceptAuth.bind(this),
                sendTextMessage: this.sendTextMessage.bind(this)
            };
        },
        onStateChanged: function () {
            if (typeof this.stateChanged === "function") {
                this.stateChanged();
            }
        },
        // mock will call this when it's time to rerender channels in ui
        onChannelsChanged: function () {
            var newModel = {chatChannels: {}, tlkeHandshakesInProgress: {}};
            var wrapper = this.wrapper;
            $.each(this.tlkeHandshakesInProgress, function (key, channel) {
                newModel.tlkeHandshakesInProgress[key] = wrapper.getChannelInfo(channel);
                newModel.tlkeHandshakesInProgress[key].name = key;
            });
            $.each(this.chatChannels, function (key, channel) {
                newModel.chatChannels[key] = wrapper.getChannelInfo(channel);
                newModel.chatChannels[key].name = key;
            });

            this.model = newModel;
            this.onStateChanged();
        },
        createTlkeHandshakeChannel: function () {
            var name = urandom.name(), chatChannels = this.chatChannels, wrapper = this.wrapper;
            this.tlkeHandshakesInProgress[name] = this.wrapper.createTlkeHandshakeChannel();
            wrapper.addPromptListener(this.tlkeHandshakesInProgress[name], function (token, context) {
                if (token instanceof TlkeHandshakeChannel.NewChannelToken) {
                    // handshake produced keys and transport channel ids
                    chatChannels[name] = wrapper.createChatChannel();
                    chatChannels[name].enterToken(token);
                }
            });
            this.onChannelsChanged();
        },

        generate: function (key) {
            try {
                this.tlkeHandshakesInProgress[key].enterToken(new TlkeHandshakeChannel.GenerateToken());
            } catch (ex) {
                console.error(ex);
            }
        },

        accept: function (key, offer) {
            try {
                this.tlkeHandshakesInProgress[key].enterToken(new TlkeHandshakeChannel.OfferToken(offer));
            } catch (ex) {
                console.error(ex);
            }
        },

        acceptAuth: function (key, auth, context) {
            try {
                this.tlkeHandshakesInProgress[key].enterToken(new TlkeHandshakeChannel.AuthToken(auth));
                this.wrapper.removePrompt(context);
            } catch (ex) {
                console.error(ex);
            }
        },

        sendTextMessage: function (key, messageData) {
            try {
                // to append this message to a sender channel as my message
                this.wrapper.processMessage(this.chatChannels[key], messageData);
                this.chatChannels[key].sendMessage(messageData);
            } catch (ex) {
                console.error(ex);
            }
        }
    };
    return App;

});