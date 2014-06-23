define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var fixedId = require("mixins/fixedId");
    var model = require("mixins/model");
    var Dictionary = require("modules/dictionary/dictionary");
    var CouchPolling = require("./CouchPolling");
    var CouchGetting = require("./CouchGetting");
    var Hex = require("modules/multivalue/hex");
    var $ = require("zepto");
    var Multivalue = require("modules/multivalue/multivalue");
    var tools = require("modules/tools");

    function CouchTransport() {
        this.fixedId = "F2E281BB-3C0D-4CED-A0F1-A65771AEED9A";
        this._defineEvent("changed");
        this._defineEvent("networkPacket");

        // url => polling
        this._pollings = {};
        // url => since
        this.sinces = {};

        // messages enqueued to send
        // url => [{ChannelId:"", DataString:""}]
        this.messages = {};

        this._gettings = {};
    }

    extend(CouchTransport.prototype, eventEmitter, serializable, fixedId, model, {
        serialize: function (packet, context) {
            packet.setData({
                sinces: this.sinces,
                messages: this.messages
            });
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this.sinces = data.sinces;
            this.messages = data.messages;
            this._sendAllMessages();
        },

        _handlePollingPackets: function (evt) {
            evt.packets.forEach(function (packet) {
                console.log("got message from %s", packet.channelName);
                var channelId = Hex.fromString(packet.channelName);
                var data = Hex.fromString(packet.data);
                this.fire("networkPacket", {addr: channelId, data: data, seq: packet.seq});
            });
        },

        _createPolling: function (url) {
            var polling = new CouchPolling(url, this.sinces[url] || 0);
            polling.on("channelPackets", this._handlePollingPackets, this);
            polling.on("changed", this._handlePollingChanged, this);
            this._pollings[url] = polling;
            return polling;
        },

        _createGetting: function (url) {
            var getting = new CouchGetting(url);
            getting.on("channelPackets", this._handlePollingPackets, this);
            this._gettings[url] = getting;
            return getting;
        },


        _handlePollingChanged: function (polling) {
            var since = polling.since, url;
            for (url in this._pollings) {
                if (this._pollings.hasOwnProperty(url) && this._pollings[url] === polling) {
                    break;
                }
            }
            this.sinces[url] = since;
            this._onChanged();
        },
        _getPolling: function (url) {
            return this._pollings[url] || this._createPolling(url);
        },
        _getGetting: function (url) {
            return this._gettings[url] || this._createGetting(url);
        },

        // addr can be array
        openAddr: function (args) {
            var url = args.url;
            var addr = args.addr;
            if (tools.isArray(addr)) {
                addr.forEach(this.openAddr.bind(this, url));
                return;
            }
            var polling = this._getPolling(url);
            polling.addChannel(addr.as(Hex).toString());
        },
        closeAddr: function (args) {
            var url = args.url;
            var addr = args.addr;
            if (tools.isArray(addr)) {
                addr.forEach(this.closeAddr.bind(this, url));
                return;
            }
            var polling = this._getPolling(url);
            polling.removeChannel(addr.as(Hex).toString());
        },

        fetchAll: function (args) {
            var url = args.url;
            var addr = args.addr;
            this._getGetting(url).addChannel(addr.as(Hex).toString());
        },

        _sendAllMessages: function () {
            var url;
            for (url in this.messages) {
                if (this.messages.hasOwnProperty(url)) {
                    this._send(url);
                }
            }
        },

        _send: function (url) {
            if (!this.messages[url].length) { return; }
            var message = this.messages[url].pop();

            console.log("sending message to %s, %s bytes", message.ChannelId, JSON.stringify(message).length);
            $.ajax({
                type: "POST",
                contentType: "application/json",
                context: this,
                url: url,
                data: JSON.stringify(message),
                success: function (data, status, xhr) { this._send(url); },
                error: function (xhr, errorType, error) {
                    console.warn("Message sending failed: ", error || errorType);
                    this.messages[url].push(message);
                    setTimeout((function () { this._send(url); }).bind(this), 5000);
                }
            });

        },

        sendNetworkPacket: function (args) {
            var networkPacket = args.networkPacket;
            var url = args.url;
            invariant(networkPacket.addr instanceof Multivalue, "networkPacket.addr must be multivalue");
            invariant(networkPacket.data instanceof Multivalue, "networkPacket.data must be multivalue");

            var addr = networkPacket.addr;
            var packet = networkPacket.data;

            if (!this.messages[url]) {
                this.messages[url] = [];
            }

            this.messages[url].unshift({
                ChannelId: addr.as(Hex).toString(),
                DataString:  packet.as(Hex).toString()
            });

            if (this.messages[url].length === 1) {
                this._send(url);
            }
        },

        destroy: function () {
            this._pollings.items.forEach(function (item) {
                item.value.reset();
            });
        }




    });

    module.exports = CouchTransport;
});