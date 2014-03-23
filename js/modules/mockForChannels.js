define([
    "modules/channels/tlkeHandshakeChannel",
    "modules/channels/chatChannel",
    "tools/random",
    "modules/data-types/hex",
    "modules/couchTransport"
], function (TlkeHandshakeChannel, ChatChannel, random, Hex, CouchTransport) {
    "use strict";

    function Service(id) {
        this.channels = [];
        this.stateChanged = null;
        this.undelivered = [];
        this.transport = new CouchTransport("http://couch.ctx.im:5984/tl_channels", null, id);
        this.transport.setHandler(this._onCouchMessage.bind(this));
    }

    Service.prototype = {
        getChannelInfo: function (channel) {
            var entry = this.getChannelEntry(channel);
            return {
                state: channel.state,
                messages: entry.messages,
                prompts: entry.prompts
            };
        },

        _onCouchMessage: function (chIdHex, dataHex) {
            console.log("received message from ", chIdHex);
            var receiver = this.getChannelInfoByInId(chIdHex);
            if (!receiver) {
                this.undelivered.push({
                    to: chIdHex,
                    content: bytes
                });
                return;
            }
            receiver.channel.processPacket(new Hex(dataHex));
        },
        _sendCouchMessage: function (chId, data) {
            this.transport.sendMessage(chId.as(Hex).value, data.as(Hex).value);
        },
        _addCouchListeningChannel: function (chId) {
            this.transport.addChannel(chId.as(Hex).value);
        },

        _bindChannel: function (ch) {
            ch.setMsgProcessor(this.createMsgProcessor(ch));
            ch.setPacketSender(this.createPacketSender(ch));
            ch.setTokenPrompter(this.createTokenPrompter(ch));
            ch.setDirtyNotifier(this.createDirtyNotifier(ch));
            ch.setChannelNotifier(this.createChannelNotifier(ch));
            ch.setRng(random);

            this.channels.push({channel: ch, messages: [], prompts: [], listeners: []});
            this.notifyStateChanged();
        },
        createChatChannel: function () {
            var ch = new ChatChannel();
            this._bindChannel(ch);
            return ch;
        },
        createTlkeHandshakeChannel: function () {
            var ch = new TlkeHandshakeChannel();
            this._bindChannel(ch);
            return ch;
        },
        processMessage: function (channel, message) {
            this.getChannelEntry(channel).messages.push(message);
            this.notifyStateChanged();
        },
        getChannelEntry: function (channel) {
            var found = this.channels.filter(function (entry) { return entry.channel === channel; });
            if (!found.length) {
                throw new Error("channel not found");
            }
            return found[0];
        },

        getChannelInfoByInId: function (inIdHex) {
            var found = this.channels.filter(function (entry) {
                return entry.inId && entry.inId.as(Hex).value === inIdHex;
            });
            if (!found.length) {
                return null;
            }
            return found[0];
        },
        sendPacket: function (channel, bytes) {
            var chId = this.getChannelEntry(channel).outId;
            console.log("sending message to " + chId.as(Hex).value);
            this._sendCouchMessage(chId, bytes);
        },
        prompt: function (channel, token, context) {
            var entry = this.getChannelEntry(channel);
            entry.prompts.push({token: token, context: context});
            this.notifyStateChanged();
            entry.listeners.forEach(function (cb) {
                cb(token, context);
            });
        },

        addPromptListener: function (channel, cb) {
            this.getChannelEntry(channel).listeners.push(cb);
        },

        removePrompt: function (context) {
            this.channels.forEach(function (entry) {
                var index;
                for (index = entry.prompts.length - 1; index > -1; index -= 1) {
                    if (entry.prompts[index].context === context) { break; }
                }
                if (index !== -1) {
                    entry.prompts.splice(index, 1);
                }
            });
            this.notifyStateChanged();
        },

        notifyStateChanged: function () {
            if (typeof this.stateChanged === "function") {
                this.stateChanged();
            }
        },


        notifyDirty: function (channel) {
            //console.log(channel, "will be saved");
            this.notifyStateChanged();
        },
        notifyIds: function (channel, idsObj) {
            var entry = this.getChannelEntry(channel);
            entry.inId = idsObj.inId;
            entry.outId = idsObj.outId;

            this._addCouchListeningChannel(idsObj.inId);
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