define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var Hex = require("modules/multivalue/hex");
    var model = require("mixins/model");
    var isArray = require("modules/tools").isArray;

    function CouchPolling(url, since) {
        invariant(url, "Can i haz url?");
        invariant(since || since === 0, "Can i haz since?");
        this.addrs = [];
        this.url = url;
        this.since = since;
        this._defineEvent("channelPacket");
        this._defineEvent("changed");
    }

    extend(CouchPolling.prototype, eventEmitter, model, {
        addAddr: function (addr) {
            if (isArray(addr)) {
                addr.forEach(this.addAddr, this);
                return;
            }
            var addrValue = addr.as(Hex).toString();
            if (this.addrs.indexOf(addrValue) === -1) {
                console.log("opening addr %s", addrValue);
                this.addrs.push(addrValue);
            }
        },
        removeAddr: function (addr) {
            if (isArray(addr)) {
                addr.forEach(this.removeAddr, this);
                return;
            }
            var addrValue = addr.as(Hex).toString();
            var index = this.addrs.indexOf(addrValue);
            if (index !== -1) {
                console.log("closing addr %s", addrValue);
                this.addrs.splice(index, 1);
            }
        },
        onChannelPacket: function () {
            var channelId = "";
            var data = "";
            this.fire("channelPacket", {channelId: channelId, channelData: data});
        }
    });

    module.exports = CouchPolling;
});