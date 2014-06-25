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

        init: function () {
            this.checkFactory();
            var factory = this._factory;
            this._tlecBuilder = factory.createTlecBuilder();
            this._transportAdapter = factory.createTransportAdapter();
            this._link();
        },

        enterOffer: function (offer) {
            this._tlecBuilder.enterOffer(offer);
        },

        enterAuth: function (auth) {
            this._tlecBuilder.enterAuth(auth);
        },

        generateOffer: function () {
            this._tlecBuilder.generate();
        },

        getStatus: function () {
            return this._tlecBuilder ? this._tlecBuilder.status : null;
        },

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
            if (this._tlecBuilder && this._transportAdapter) {

                this._tlecBuilder.on("done", this._onDone, this);
                this._tlecBuilder.on("message", this._onMessage, this);
                this._tlecBuilder.on("offer", this._onOffer, this);
                this._tlecBuilder.on("auth", this._onAuth, this);
                this._tlecBuilder.on("openAddrIn", this._transportAdapter.openAddr, this._transportAdapter);
                this._tlecBuilder.on("closeAddrIn", this._transportAdapter.closeAddr, this._transportAdapter);
                this._tlecBuilder.on("networkPacket", this._transportAdapter.sendPacket, this._transportAdapter);

                this._transportAdapter.on("packetFromTransport", this._tlecBuilder.processNetworkPacket, this._tlecBuilder);
                this._transportAdapter.on("packetForTransport", this._transport.sendPacket, this._transport);
                this._transportAdapter.on("addrIn", this._transport.openAddr, this._transport);
                this._transportAdapter.on("fetchAll", this._transport.fetchAll, this._transport);

                this._transport.on("networkPacket", this._transportAdapter.processPacket, this._transportAdapter);

            }

        },

        _onOffer: function (offer) {
            this.fire("offer", offer);
        },
        _onAuth: function (auth) {
            this.fire("auth", auth);
        },
        _onMessage: function (msg) {
            this.fire("message", msg);
        },
        _onDone: function () {
            this.fire("done", this);
        },

        destroy: function () {
            if (this._tlecBuilder && this._transportAdapter) {
                this._tlecBuilder.destroy();
                this._transportAdapter.destroy();
            }
        }

    });

    module.exports = TlecSuite;
});