define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");


    function TlecSuite() {
        this._defineEvent("changed");
        this._defineEvent("offer");
        this._defineEvent("auth");
        this._defineEvent("message");
        this._defineEvent("done");

        this._tlecBuilder = null;
        this._transportAdapter = null;
        this._transport = null;

        this._cachedPackets = [];
    }

    extend(TlecSuite.prototype, eventEmitter, serializable, model, {

        setTransport: function (transport) {
            this._transport = transport;
            this._transport.on("packets", this._onTransportPackets, this);
        },

        init: function () {
            this.checkFactory();
            var factory = this._factory;
            this._tlecBuilder = factory.createTlecBuilder();
            this._link();
        },

        run: function () {

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
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            var data = packet.getData();
            this._tlecBuilder = context.deserialize(packet.getLink("_tlecBuilder"), factory.createTlecBuilder, factory);
        },

        _link: function () {
            invariant(this._transport, "transport is not set");
            if (this._tlecBuilder) {

                this._tlecBuilder.on("done", this._onDone, this);
                this._tlecBuilder.on("message", this._onMessage, this);
                this._tlecBuilder.on("offer", this._onOffer, this);
                this._tlecBuilder.on("auth", this._onAuth, this);
                this._tlecBuilder.on("openAddrIn", this._transport.beginPolling, this._transport);
                this._tlecBuilder.on("openAddrIn", this._onTlecOpenAddr, this);
                this._tlecBuilder.on("closeAddrIn", this._transport.endPolling, this._transport);
                this._tlecBuilder.on("networkPacket", this._transport.sendPacket, this._transport);
            }

        },

        _onTlecOpenAddr: function (addr) {
            if (!this.fetched) {
                this._transport.fetchAll(addr);
            }
        },

        _addPacketToCached: function (packet) {
            if (!this._cachedPackets.some(function (p) {return p.seq === packet.seq; })) {
                this._cachedPackets.push(packet);
            }
        },
        _onTransportPackets: function (args) {
            if (this.fetched) {
                this._processPackets(this._cachedPackets);
            } else {
                this._cachedPackets.forEach(this._addPacketToCached, this);
                if (args.since === 0) {
                    this.fetched = true;
                    this._processPackets(this._cachedPackets);
                }
            }
        },

        _processPackets: function (packets) {
            packets
                .sort(function (a, b) { return a.seq - b.seq; })
                .forEach(this._tlecBuilder.processNetworkPacket, this._tlecBuilder);
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
            if (this._tlecBuilder) {
                this._tlecBuilder.destroy();
            }
        }

    });

    module.exports = TlecSuite;
});