define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var CouchAdapter = require("./CouchAdapter");

    function CouchTlec() {
        this._defineEvent("changed");
        this._defineEvent("offer");
        this._defineEvent("auth");
        this._defineEvent("message");
        this._defineEvent("done");

        this._tlecBuilder = null;
        this._transportAdapters = {};
        this._transport = null;

    }

    extend(CouchTlec.prototype, eventEmitter, serializable, model, {

        setTransport: function (transport) {
            this._transport = transport;
        },

        init: function () {
            this.checkFactory();
            var factory = this._factory;
            this._tlecBuilder = factory.createTlecBuilder();
            this._link();
            this._tlecBuilder.build();
        },

        run: function () {
            var adapters = this._transportAdapters, context;
            for (context in adapters) {
                if (adapters.hasOwnProperty(context)) {
                    adapters[context].run();
                }
            }
        },

        sendMessage: function (args) {
            this._tlecBuilder.sendMessage(args);
        },
        enterOffer: function (offer) {
            this._tlecBuilder.enterOffer(offer);
        },

        enterAuth: function (auth) {
            this._tlecBuilder.enterAuth(auth);
        },

        generateOffer: function () {
            this._tlecBuilder.generateOffer();
        },

        getStatus: function () {
            return this._tlecBuilder ? this._tlecBuilder.status : null;
        },

        serialize: function (packet, context) {
            var adapters = {}, adContext;
            for (adContext in this._transportAdapters) {
                if (this._transportAdapters.hasOwnProperty(adContext)) {
                    adapters[adContext] = this._transportAdapters[adContext].serialize();
                }
            }
            packet.setData({
                adapters: adapters
            });
            packet.setLink("_tlecBuilder", context.getPacket(this._tlecBuilder));
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            this._tlecBuilder = context.deserialize(packet.getLink("_tlecBuilder"), factory.createTlecBuilder, factory);
            var data = packet.getData(), adContext;
            for (adContext in data.adapters) {
                if (data.adapters.hasOwnProperty(adContext)) {
                    this._addAdapter(adContext, CouchAdapter.deserialize(this._transport, data.adapters[adContext]))
                }
            }
            this._link();
        },

        _link: function () {
            invariant(this._transport, "transport is not set");
            if (this._tlecBuilder) {
                this._tlecBuilder.on("changed", this._onChanged, this);
                this._tlecBuilder.on("done", this._onDone, this);
                this._tlecBuilder.on("message", this._onMessage, this);
                this._tlecBuilder.on("offer", this._onOffer, this);
                this._tlecBuilder.on("auth", this._onAuth, this);
                this._tlecBuilder.on("openAddrIn", this._onTlecOpenAddr, this);
                this._tlecBuilder.on("closeAddrIn", this._onTlecCloseAddr, this);
                this._tlecBuilder.on("networkPacket", this._transport.sendPacket, this._transport);
            }

        },

        _onTlecOpenAddr: function (args) {
            var context = args.context;
            var adapter = new CouchAdapter(this._transport, args);
            this._addAdapter(context, adapter);
            this._onChanged();
            adapter.init();
        },

        _addAdapter: function (context, adapter) {
            adapter.on("packet", this._tlecBuilder.processNetworkPacket, this._tlecBuilder);
            adapter.on("changed", this._onChanged, this);
            this._transportAdapters[context] = adapter;
        },
        _onTlecCloseAddr: function (args) {
            var context = args.context;
            var adapter = this._transportAdapters[context];
            if (adapter) {
                adapter.off("packet", this._tlecBuilder.processNetworkPacket, this._tlecBuilder);
                adapter.off("changed", this._onChanged, this);
                adapter.destroy();
                delete this._transportAdapters[context];
                this._onChanged();
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
            if (this._tlecBuilder) {
                this._tlecBuilder.destroy();
            }
        }

    });

    module.exports = CouchTlec;
});