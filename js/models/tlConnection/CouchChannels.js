define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var CouchPolling = require("./CouchPolling");

    function CouchChannels(url, since) {
        invariant(url, "Can i haz url?");
        invariant(since || since === 0, "Can i haz since?");
        this._defineEvent("channelPacket");
        this._defineEvent("changed");
        this.since = since;

        this.mainPolling = new CouchPolling(url, since);
        this.getAllPolling = new CouchPolling(url, 0, true);

        this.mainPolling.on("changedSince", this._onPollingSince, this);
        this.mainPolling.on("channelPackets", this._onMainPollingPackets, this);
        this.getAllPolling.on("channelPackets", this._onGetAllPollingEnded, this);
        this.getAllPolling.on("timedOut", this._onGetAllPollingEnded, this);
    }

    extend(CouchChannels.prototype, eventEmitter, {
        addChannel: function (channelName, getAll) {
            if (getAll) {
                this.getAllPolling.addChannel(channelName);
            } else {
                this.mainPolling.addChannel(channelName);
            }
        },

        removeChannel: function (channelName) {
            this.mainPolling.removeChannel(channelName);
            this.getAllPolling.removeChannel(channelName);
        },

        _onGetAllPollingEnded: function (args) {
            args.channels.forEach(this.mainPolling.addChannel, this.mainPolling);
            if (args.packets) {
                args.packets.forEach(this._onPacket, this);
            }
            this.getAllPolling.reset();
        },
        _onMainPollingPackets: function (args) {
            args.packets.forEach(this._onPacket, this);
        },

        _onPollingSince: function (since) {
            this.since = since;
            this._onChanged();
        },

        _onPacket: function (packet) {
            this.fire("channelPacket", packet);
        },

        _onChanged: function () {
            this.fire("changed", this);
        },

        reset: function () {
            this.mainPolling.reset();
            this.getAllPolling.reset();
        }
    });

    window.cc = CouchChannels;
    module.exports = CouchChannels;
});