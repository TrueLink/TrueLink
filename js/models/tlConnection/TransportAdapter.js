define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");


    function TransportAdapter() {
        this._defineEvent("changed");
        this._defineEvent("packetFromTransport");
        this._defineEvent("packetForTransport");
        this._defineEvent("addrIn");
        this._defineEvent("fetchAll");
        this._lastSeq = 0;
        this._packetCache = [];
        this.addrIn = null;
        this.profile = null;
    }

    extend(TransportAdapter.prototype, eventEmitter, serializable, model, {

        setProfile: function (profile) {
            this.profile = profile;
            // todo this.profile.on("urlChanged")
        },


//        changeUrl: function (params) {
//            var oldUrl = params.oldUrl;
//            var newUrl = params.newUrl;
//            // resend messages from oldUrl queue
//            // reset this._pollings[profile]
//            console.log("url %s changed to %s", oldUrl, newUrl);
//            throw new Error("CouchTransport._onProfileUrlChanged() is not implemented");
//        },

        processPacket: function (packet) {
            this._lastSeq = packet.seq;
        },
        sendPacket: function (args) {

        },

        openAddr: function (addr) {
            this.addrIn = addr;
            //this.
        },

        run: function () {
            if (this.addrIn) {

            }
        },

        serialize: function (packet, context) {
            packet.setData({
                seq: this._lastSeq
            });
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var data = packet.getData();
            this._lastSeq = data.seq;
        },

        _onPacketForTransport: function () {
            this.fire("packetForTransport", null);
        },
        _onPacketFromTransport: function () {
            this.fire("packetFromTransport", null);
        }

    });

    module.exports = TransportAdapter;
});