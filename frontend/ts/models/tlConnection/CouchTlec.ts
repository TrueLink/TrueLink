    "use strict";
    import modules = require("modules");
    import invariant = require("invariant");
    import extend = require("../../tools/extend");
    var eventEmitter = modules.events.eventEmitter;
    var serializable = modules.serialization.serializable;
    import model = require("../../mixins/model");
    import CouchAdapter = require("./CouchAdapter");

    import MultivalueModule = require("Multivalue");
    var Hex = MultivalueModule.Hex;

    import uuid = require("uuid");

    function CouchTlec() {
        this._defineEvent("changed");
        this._defineEvent("offer");
        this._defineEvent("auth");
        this._defineEvent("message");
        this._defineEvent("done");
        this._defineEvent("tlkeDone");        
        this._defineEvent("syncMessage");

        this._tlecBuilder = null;
        this._transportAdapters = {};
        this._transport = null;

        this.id = null;
    }

    extend(CouchTlec.prototype, eventEmitter, serializable, model, {

        setTransport: function (transport) {
            this._transport = transport;
        },

        init: function (syncArgs?) {
            this.checkFactory();
            var factory = this._factory;
            this._tlecBuilder = factory.createTlecBuilder();
            this._link();
            if (syncArgs) {
                this.id = syncArgs.id;
                this._tlecBuilder.sync(syncArgs);
            } else {
                this.id = uuid();
                this._tlecBuilder.build();
            }
        },

        //runs only after deserializing established connection
        run: function () {
            var adapters = this._transportAdapters, context;
            for (context in adapters) {
                if (adapters.hasOwnProperty(context)) {
                    adapters[context].init({fetchIfZeroSince : true});
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
                adapters: adapters,
                id: this.id
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
                    this._addAdapter(adContext, (<any>CouchAdapter).deserialize(this._transport, data.adapters[adContext]))
                }
            }
            this.id = data.id;
            this._link();
        },

        _link: function () {
            invariant(this._transport, "transport is not set");
            if (this._tlecBuilder) {
                this._tlecBuilder.on("changed", this._onChanged, this);
                this._tlecBuilder.on("done", this._onDone, this);
                this._tlecBuilder.on("tlkeDone", this._onTlkeDone, this);
                this._tlecBuilder.on("message", this._onMessage, this);
                this._tlecBuilder.on("offer", this._onOffer, this);
                this._tlecBuilder.on("auth", this._onAuth, this);
                this._tlecBuilder.on("openAddrIn", this._onTlecOpenAddr, this);
                this._tlecBuilder.on("closeAddrIn", this._onTlecCloseAddr, this);
                this._tlecBuilder.on("networkPacket", this._transport.sendPacket, this._transport);
                this._tlecBuilder.on("generatedHashtail", this._onGeneratedHashtail, this);
                this._tlecBuilder.on("delegatedHashtail", this._onDelegatedHashtail, this);
            }
        },

        _onGeneratedHashtail: function (args) {
            this._sendSyncMessage("hashtail-generated", {
                start: args.start.as(Hex).serialize(),
                counter: args.counter
            });
        },

        _onDelegatedHashtail: function (what, args) {
            this._sendSyncMessage("hashtail-delegated", {
                start: args.start.as(Hex).serialize(),
                counter: args.counter
            });
        },

        _sendSyncMessage: function (what, args) {
            this.fire("syncMessage", {
                id: this.id,
                what: what,
                args: args             
            });
        },

        processSyncMessage: function (args) {
            if (args.id !== this.id) { return; }

            if (args.what === "hashtail-generated") {
                this._processHashtailGeneratedSyncMessage(args.args);
            } else if (args.what === "hashtail-generated") {
                this._processHashtailDelegatedSyncMessage(args.args);
            }
        },

        _processHashtailGeneratedSyncMessage: function (args) {
            this._tlecBuilder.addHashtail({
                start: Hex.deserialize(args.start),
                counter: args.counter
            });
        },

        _processHashtailDelegatedSyncMessage: function (args) {
            this._tlecBuilder.processHashtailDelegation({
                target: args.target,
                hashtail: {
                    start: Hex.deserialize(args.hashtail.start)
                }
            });
        },

        _onTlecOpenAddr: function (args) {
            var context = args.context;
            var adapter = new CouchAdapter.CouchAdapter(this._transport, args);
            this._addAdapter(context, adapter);
            this._onChanged();
            adapter.init({});
        },

        _addAdapter: function (context, adapter) {
            adapter.onPacket.on(this._tlecBuilder.processNetworkPacket, this._tlecBuilder);
            adapter.onChanged.on(this._onChanged, this);
            this._transportAdapters[context] = adapter;
        },
        _onTlecCloseAddr: function (args) {
            var context = args.context;
            var adapter = this._transportAdapters[context];
            if (adapter) {
                adapter.onPacket.off(this._tlecBuilder.processNetworkPacket, this._tlecBuilder);
                adapter.onChanged.off(this._onChanged, this);
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
        _onTlkeDone: function (args) {
            this.fire("tlkeDone", args);
        },

        destroy: function () {
            if (this._tlecBuilder) {
                this._tlecBuilder.destroy();
            }
        },

        takeHashtail: function () {
            return this._tlecBuilder.takeHashtail();
        }

    });

    export = CouchTlec;
