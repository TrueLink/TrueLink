define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var Hex = require("modules/multivalue/hex");


    function CouchPolling(url, since) {
        invariant(url, "Can i haz url?");
        invariant(since || since === 0, "Can i haz since?");
        this.addrs = [];
        this.url = url;
        this.since = since;
        this._defineEvent("channelPacket");
        this._defineEvent("changed");
    }

    extend(CouchPolling.prototype, eventEmitter, {
        addAddr: function (addr) {
            console.log("adding addr %s to %s", addr.as(Hex), this.url);
        },
        onChanged: function () {
            this.fire("changed", this);
        },
        onChannelPacket: function () {
            var channelId = "";
            var data = "";
            this.fire("channelPacket", {channelId: channelId, channelData: data});
        }
    });

    module.exports = CouchPolling;
});