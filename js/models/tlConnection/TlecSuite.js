define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");


    function TlecSuite() {
        this._defineEvent("changed");

        this._tlecBuilder = null;
        this._transportAdapter = null;
        this._transport = null;
    }

    extend(TlecSuite.prototype, eventEmitter, serializable, model, {

        setTransport: function (transport) {
            this._transport = transport;
        },

        init: function () {},

        // public methods go here

        serialize: function (packet, context) {
            packet.setData({});
            packet.setLink("_tlecBuilder", context.getPacket(this._tlecBuilder));
            packet.setLink("_transportAdapter", context.getPacket(this._transportAdapter));
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            var data = packet.getData();
            this._tlecBuilder = context.deserialize(packet.getLink("_tlecBuilder"), factory.createTlecBuilder, factory);
            this._transportAdapter = context.deserialize(packet.getLink("_transportAdapter"), factory.createTransportAdapter, factory);


        },

        _link: function () {


        },

        //_onSmthEvt: function (args) {
        //    this.fire("evtName", args);
        //},

        destroy: function () {
        }

    });

    module.exports = TlecSuite;
});