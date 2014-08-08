define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var Hex = require("modules/multivalue/hex");
    var TlecBuilder = require("modules/channels/TlecBuilder");
    var GrConnectionFilter = require("models/filters/GrConnectionFilter");

    function GrConnection() {

        this._defineEvent("changed");
        this._defineEvent("message");

        this._tlgrs = [];
        this._transport = null;
    }

    //interface IGrConnectionInitParams {
    //
    //}
    extend(GrConnection.prototype, eventEmitter, serializable, model, {
        //called when creating totally new connection (not when deserialized)
        init: function (args) {
            this._transport = args.transport;
            var tlgr = this._factory.createTlgr();

            tlgr.init({
                invite: args.invite,
                userName: args.userName
            });

            tlgr.on("packet", function (packet/*{addr, data}*/) {
                this._transport.sendPacket(packet);
            }.bind(this), tlgr);

        }
    })
});

