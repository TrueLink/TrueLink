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
    var Hex = require("modules/multivalue/hex");
    var $ = require("zepto");
    var Multivalue = require("modules/multivalue/multivalue");
    var tools = require("modules/tools");

    function CouchTransport() {
        this.fixedId = "F2E281BB-3C0D-4CED-A0F1-A65771AEED9A";
        this._defineEvent("changed");
        this._defineEvent("networkPacket");

        // profile => polling
        this._pollings = new Dictionary();
        // url => since
        this.sinces = {};

        // url => [{ChannelId:"", DataString:""}]
        this.messages = {};
    }

    extend(CouchTransport.prototype, eventEmitter, serializable, fixedId, model, {
        serialize: function (packet, context) {
            packet.setData({sinces: this.sinces});
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this.sinces = data.sinces;
        },
        init: function () {
        },

        _handlePollingPacket: function (evt) {
            console.log("got message from %s", evt.channelName);
            var channelId = Hex.fromString(evt.channelName);
            var data = Hex.fromString(evt.data);
            this.fire("networkPacket", {addr: channelId, data: data});
        },

        _createPolling: function (profile) {
            var polling = new CouchPolling(profile.pollingUrl, 0);
            polling.on("channelPacket", this._handlePollingPacket, this);
            polling.on("changed", this._handlePollingChanged, this);
            profile.on("urlChanged", this._onProfileUrlChanged, this);
            this._pollings.item(profile, polling);
            return polling;
        },

        _onProfileUrlChanged: function (params, profile) {
            var oldUrl = params.oldUrl;
            var newUrl = params.newUrl;
            // resend messages from oldUrl queue
            console.log("url changed to %s", profile.pollingUrl);
        },

        _handlePollingChanged: function (polling) {
            var since = polling.since;
            var profile = this._pollings.first(function (item) { return item.value === polling; });
            this.sinces[profile.url] = since;
            this._onChanged();
        },
        _getPolling: function (profile) {
            return this._pollings.item(profile) || this._createPolling(profile);
        },

        // addr can be array
        openAddr: function (profile, addr) {
            if (tools.isArray(addr)) {
                addr.forEach(this.openAddr.bind(this, profile));
                return;
            }
            var polling = this._getPolling(profile);
            polling.removeChannel(addr.as(Hex).toString());
        },
        closeAddr: function (profile, addr) {
            if (tools.isArray(addr)) {
                addr.forEach(this.closeAddr.bind(this, profile));
                return;
            }
            var polling = this._getPolling(profile);
            polling.addChannel(addr.as(Hex).toString());
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

        sendNetworkPacket: function (profile, networkPacket) {
            invariant(networkPacket.addr instanceof Multivalue, "networkPacket.addr must be multivalue");
            invariant(networkPacket.data instanceof Multivalue, "networkPacket.data must be multivalue");

            var addr = networkPacket.addr;
            var packet = networkPacket.data;

            var url = profile.pollingUrl;
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
        }



    });

    module.exports = CouchTransport;
});