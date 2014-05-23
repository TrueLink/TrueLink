define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var fixedId = require("mixins/fixedId");
    var model = require("mixins/model");
    var Dictionary = require("modules/dictionary");
    var CouchPolling = require("./CouchPolling");

    function Transport(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this.fixedId = "F2E281BB-3C0D-4CED-A0F1-A65771AEED9A";
        this._defineEvent("changed");
        this._defineEvent("networkPacket");

        // profile => polling
        this._pollings = new Dictionary();
        // url => since
        this.sinces = {};

    }

    extend(Transport.prototype, eventEmitter, serializable, fixedId, model, {
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
            var channelId = evt.channelId;
            var data = evt.channelData;
            this.fire("networkPacket", {channelId: channelId, data: data});
        },

        _createPolling: function (profile) {
            var polling = new CouchPolling(0, profile.pollingUrl);
            polling.on("channelPacket", this._handlePollingPacket, this);
            polling.on("changed", this._handlePollingChanged, this);
            this._pollings.item(profile, polling);
        },

        _handlePollingChanged: function (polling) {
            var since = polling.since;
            var profile = this._pollings.first(function (item) { return item.value === polling; });
            this.sinces[profile.url] = since;
            this.onChanged();
        },
        _getPolling: function (profile) {
            return this._pollings.item(profile) || this._createPolling(profile);
        },
        openAddr: function (addr, profile) {
            var polling = this._getPolling(profile);
            polling.addAddr(addr);
        }



    });

    module.exports = Transport;
});