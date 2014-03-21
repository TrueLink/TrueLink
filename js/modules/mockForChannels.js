define(["modules/channels/establishChannel", "tools/random", "modules/data-types/hex"], function (Establish, random, Hex) {
    "use strict";

    function Service() {
        this.channels = [];
        this.prompts = [];
        this.messages = [];
        this.stateChanged = null;
        this.undelivered = [];
    }

    Service.prototype = {
        getInfo: function (channel) {
            return {
                state: channel.state,
                messages: this.getMessages(channel),
                prompts: this.getPrompts(channel)
            };
        },
        createChatChannel: function () {

        },
        createEstablishChannel: function () {
            var ch = new Establish();
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
            this.getMessageInfo(channel).messages.push(message);
            if (message instanceof Establish.NewChannelMessage) {
                console.log(channel, " has established a new channel with outId: " + message.outId.as(Hex).value + " and inId: " + message.inId);
            }
            this.notifyStateChanged();
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
            var found = this.channels.filter(function (chI) { return chI.inId.as(Hex).value === inId.as(Hex).value; });
            if (!found.length) {
                return null;
            }
            return found[0];
        },
        sendPacket: function (channel, bytes) {
            var chId = this.getChannelInfo(channel).outId;
            console.log("sending message to " + chId.as(Hex).value);
            var receiver = this.getChannelInfoByInId(chId);
            if (!receiver) {
                this.undelivered.push({
                    to: chId.as(Hex).value,
                    content: bytes
                });
                return;
            }
            setTimeout(function () {
                try {
                    receiver.channel.processPacket(bytes);
                } catch (ex) {
                    console.error(ex);
                }
            }, 500);
        },
        prompt: function (channel, token, context) {
            var promptsInfo = this.getPromptInfo(channel);
            promptsInfo.prompts.push(token);
            this.notifyStateChanged();
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
            if (this.undelivered.length) {
                this.undelivered.forEach(function (message) {
                    if (message.to === idsObj.inId.as(Hex).value) {
                        setTimeout(channel.processPacket.bind(channel, message.content), 500);
                    }
                });
            }
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