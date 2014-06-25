define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var CouchPolling = require("./CouchPolling");
    var CouchGetting = require("./CouchGetting");
    var Hex = require("modules/multivalue/hex");
    var $ = require("zepto");
    var Multivalue = require("modules/multivalue/multivalue");
    var tools = require("modules/tools");

    function CouchTransport() {
        this._defineEvent("changed");
        this._defineEvent("packets");
        this._pollingUrl = null;
        this._postingUrl = null;
        this._polling = null;
        // url => since
        this._sinces = {};

        // url => [{ChannelId: "", DataString:""}]
        this._unsentPackets = {};
    }

    extend(CouchTransport.prototype, eventEmitter, serializable, {

        _getSince: function (url) {
            if (!this._sinces[url]) {
                this._sinces[url] = 0;
            }
            return this._sinces[url];
        },
        setPollingUrl: function (newUrl) {
            if (this._pollingUrl) {
                this._getting.reset();
                this._polling.reset();
                // store addrs from running polling and getting
            }

            this._pollingUrl = newUrl;

            this._getting = new CouchGetting(newUrl);
            this._getting.on("channelPackets", this._handleGettingPackets, this);
            this._polling = new CouchPolling(newUrl, this._getSince(newUrl));
            this._polling.on("channelPackets", this._handlePollingPackets, this);
            // restore addrs from running polling and getting

        },

        setPostingUrl: function (newUrl) {
            this._postingUrl = newUrl;
        },

        serialize: function (packet, context) {
            packet.setData({
                sinces: this._sinces,
                unsent: this._unsentPackets,
                pollingUrl: this._pollingUrl,
                postingUrl: this._postingUrl,
            });
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this._sinces = data.sinces;
            this._unsentPackets = data.unsent;
            this.setPollingUrl(data.pollingUrl);
            this.setPostingUrl(data.postingUrl);
        },

        sendPacket: function (args) {
            invariant(args.addr instanceof Multivalue, "args.addr must be multivalue");
            invariant(args.data instanceof Multivalue, "args.data must be multivalue");
            invariant(this._postingUrl, "postingUrl is not set");

            var url = this._postingUrl;
            var addr = args.addr;
            var packet = args.data;

            if (!this._unsentPackets[url]) {
                this._unsentPackets[url] = [];
            }

            this._unsentPackets[url].push({
                ChannelId: addr.as(Hex).toString(),
                DataString:  packet.as(Hex).toString()
            });

            this._onChanged();

            if (this._unsentPackets[url].length === 1) {
                this._send(url);
            }
        },

        // addr can be array
        beginPolling: function (addr) {
            invariant(addr instanceof Multivalue, "addr must be multivalue");
            invariant(this._pollingUrl, "pollingUrl is not set");

            if (tools.isArray(addr)) {
                addr.forEach(this.beginPolling.bind(this, url));
                return;
            }
            this._polling.addChannel(addr.as(Hex).toString());
        },
        endPolling: function (addr) {
            invariant(addr instanceof Multivalue, "addr must be multivalue");
            invariant(this._pollingUrl, "pollingUrl is not set");

            if (tools.isArray(addr)) {
                addr.forEach(this.endPolling.bind(this, url));
                return;
            }
            this._polling.removeChannel(addr.as(Hex).toString());
        },

        fetchAll: function (addr) {
            invariant(addr instanceof Multivalue, "addr must be multivalue");
            invariant(this._pollingUrl, "pollingUrl is not set");

            this._getting.addChannel(addr.as(Hex).toString());
        },

        _handlePollingPackets: function (args, sender) {
            this._sinces[sender.url] = args.lastSeq;
            this._onChanged();
            this._onPackets(args);
        },

        _handleGettingPackets: function (args, sender) {
            this._onPackets(args);
        },

        _onPackets: function (args) {
            this.fire("packets", {
                lastSeq: args.lastSeq,
                since: args.since,
                packets: args.packets.map(function (packet) { return {
                    addr: Hex.fromString(packet.channelName),
                    data: Hex.fromString(packet.data),
                    seq: packet.seq
                }; })
            });
        },

        _sendAllPackets: function () {
            var url;
            for (url in this._unsentPackets) {
                if (this._unsentPackets.hasOwnProperty(url)) {
                    this._send(url);
                }
            }
        },

        _send: function (url, sentPacket) {
            if (sentPacket) {
                var sentIndex = this._unsentPackets[url].indexOf(sentPacket);
                if (sentIndex !== -1) {
                    this._unsentPackets[url].splice(sentIndex, 1);
                    this._onChanged();
                }
            }
            if (!this._unsentPackets[url].length) { return; }
            var packet = this._unsentPackets[url][0];


            console.log("sending packet to %s, %s bytes", packet.ChannelId, JSON.stringify(packet).length);
            $.ajax({
                type: "POST",
                contentType: "application/json",
                context: this,
                url: url,
                data: JSON.stringify(packet),
                success: function (data, status, xhr) { this._send(url, packet); },
                error: function (xhr, errorType, error) {
                    console.warn("Packet sending failed: ", error || errorType);
                    setTimeout((function () { this._send(url); }).bind(this), 5000);
                }
            });

        },

        destroy: function () {
            this._polling.reset();
            this._getting.reset();
        },

        _onChanged: function () {
            this.fire("changed", this);
        }

    });

    module.exports = CouchTransport;
});