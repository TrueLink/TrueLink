define(["modules/channels/establishChannel", "tools/random"], function (Establish, random) {
    "use strict";

    function Service() {
        this.channels = [];
        this.prompts = [];
        this.messages = [];
        this.stateChanged = null;
    }

    Service.prototype = {
        createChatChannel: function () {

        },
        createEstablishChannel: function (name) {
            var ch = new Establish();
            ch.name = name;
            ch.setMsgProcessor(this.createMsgProcessor(ch));
            ch.setPacketSender(this.createPacketSender(ch));
            ch.setTokenPrompter(this.createTokenPrompter(ch));
            ch.setDirtyNotifier(this.createDirtyNotifier(ch));
            ch.setChannelNotifier(this.createChannelNotifier(ch));
            ch.setRng(random);
            this.prompts.push({channel: ch, prompts: []});
            this.messages.push({channel: ch, messages: []});
            this.notifyStateChanged();
            return ch;
        },
        processMessage: function (channel, message) {
            if (message instanceof Establish.NewChannelMessage) {
                console.log(channel, " has established a new channel with outId: " + message.outId + " and inId: " + message.inId);
            }
        },
        getChannelInfo: function (channel) {
            var found = this.channels.filter(function (chI) { return chI.channel === channel; });
            if (!found.length) {
                throw new Error("channel not found");
            }
            return found[0];
        },
        getPromptInfo: function (channel) {
            var found = this.prompts.filter(function (chP) { return chP.channel === channel; });
            if (!found.length) {
                throw new Error("channel not found");
            }
            return found[0];
        },
        getMessageInfo: function (channel) {
            var found = this.messages.filter(function (chM) { return chM.channel === channel; });
            if (!found.length) {
                throw new Error("channel not found");
            }
            return found[0];
        },
        getChannelInfoByInId: function (inId) {
            var found = this.channels.filter(function (chI) { return chI.inId === inId; });
            if (!found.length) {
                throw new Error("channel not found");
            }
            return found[0];
        },
        sendPacket: function (channel, bytes) {
            var chId = this.getChannelInfo(channel).outId;
            console.log("sending message to " + chId);
            var receiver = this.getChannelInfoByInId(chId).channel;
            setTimeout(receiver.processPacket.bind(null, bytes), 500);
        },
        prompt: function (channel, token, context) {
            var promptsInfo = this.getPromptInfo(channel);
            promptsInfo.push(token);

        },

        notifyStateChanged: function () {
            if (typeof this.stateChanged === "function") {
                this.stateChanged();
            }
        },
        getPrompts: function (channel) {
            return this.prompts.filter(function (p) { return p.channel === channel; })[0].prompts;
        },
        getChannels: function () {
            return this.channels.map(function (chI) { return chI.channel; });
        },
        getMessages: function (channel) {
            return this.messages.filter(function (m) { return m.channel === channel; })[0].messages;
        },

        respondPrompt: function (prompt, token) {
            var channel;
            this.prompts.forEach(function (promptInfo) {
                var index = promptInfo.prompts.indexOf(prompt);
                if (index !== -1) {
                    channel = promptInfo.channel;
                    promptInfo.prompts.splice(index, 1);
                }
            });
        },

        notifyDirty: function (channel) {
            console.log(channel, "will be saved");
            this.notifyStateChanged();
        },
        notifyIds: function (channel, idsObj) {
            this.channels.push({channel: channel, inId: idsObj.inId, outId: idsObj.outId });
        },
        createMsgProcessor: function (channel) {
            return { processMessage: this.processMessage.bind(this, channel) };
        },
        createPacketSender: function (channel) {
            return { sendPacket: this.sendPacket.bind(this, channel) };
        },
        createTokenPrompter: function (channel) {
            return { prompt: this.prompt.bind(this, channel) };
        },
        createDirtyNotifier: function (channel) {
            return { notify: this.notifyDirty.bind(this, channel) };
        },
        createChannelNotifier: function (channel) {
            return { notify: this.notifyIds.bind(this, channel) };
        }
    };
    return Service;

});