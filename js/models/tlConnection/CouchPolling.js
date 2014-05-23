define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");

    function CouchPolling(url, since) {
        invariant(url, "Can i haz url?");
        invariant(since, "Can i haz since?");
        this.addrs = [];
        this.url = url;
        this.since = since;
        this._defineEvent("channelPacket");
        this._defineEvent("changed");
    }

    extend(CouchPolling.prototype, {
        addAddr: function (addr) {

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