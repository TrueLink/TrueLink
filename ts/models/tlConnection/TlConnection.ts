    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var Hex = require("modules/multivalue/hex");
    var TlecBuilder = require("modules/channels/TlecBuilder");
    var TlConnectionFilter = require("models/filters/TlConnectionFilter");

    function TlConnection() {

        this._defineEvent("changed");
        this._defineEvent("message");

        this.offer = null;
        this.auth = null;
        this._initialTlec = null;
        this._tlecs = [];
        this._addrIns = [];
        this._tlConnectionFilter = new TlConnectionFilter(this);
        this._tlConnectionFilter.on("filtered", this._onMessageSend, this);
        this._tlConnectionFilter.on("unfiltered", this._onMessage, this);
        this._transport = null;
    }

    extend(TlConnection.prototype, eventEmitter, serializable, model, {
        init: function () {
            this._initialTlec = this._factory.createCouchTlec();
            this._linkInitial();
            this._initialTlec.init();
            this._onChanged();
        },

        run: function () {
            if (this._initialTlec) {
                this._initialTlec.run();
            }
            this._tlecs.forEach(function (tlec) { tlec.run(); });
        },

        getStatus: function () {
            if (this.canSendMessages()) {
                return TlecBuilder.STATUS_ESTABLISHED;
            }
            return this._initialTlec ? this._initialTlec.getStatus() : null;
        },
        
        generateOffer: function () {
            this._initialTlec.generateOffer();
        },

        enterOffer: function (offer) {
            this._initialTlec.enterOffer(offer);
        },

        enterAuth: function (auth) {
            this._initialTlec.enterAuth(auth);
        },

        abortTlke: function () {
            this.offer = null;
            this.auth = null;
            if (this._initialTlec) {
                this._initialTlec.destroy();
            }
            this._tlecs.forEach(function (builder) { builder.destroy(); });
            this._tlecs = [];
            this.init();
        },

        serialize: function (packet, context) {

            packet.setData({
                offer: this.offer ? this.offer.as(Hex).serialize() : null,
                auth: this.auth ? this.auth.as(Hex).serialize() : null,
                addrIns: this._addrIns.map(function (addr) { return addr.as(Hex).serialize(); })
            });

            packet.setLink("_initialTlec", context.getPacket(this._initialTlec));
            packet.setLink("_tlecs", context.getPacket(this._tlecs));
        },

        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            var data = packet.getData();

            this.offer = data.offer ? Hex.deserialize(data.offer) : null;
            this.auth = data.auth ? Hex.deserialize(data.auth) : null;
            this._addrIns = data.addrIns ? data.addrIns.map(function (addr) { return Hex.deserialize(addr); }) : [];

            this._initialTlec = context.deserialize(packet.getLink("_initialTlec"), factory.createCouchTlec, factory);
            this._linkInitial();
            this._tlecs = context.deserialize(packet.getLink("_tlecs"), factory.createCouchTlec, factory);
            this._tlecs.forEach(this._linkFinishedTlec, this);
        },

        _linkFinishedTlec: function (tlecWrapper) {
            tlecWrapper.on("message", this._receiveMessage, this);
        },

        _addTlec: function (tlecWrapper) {
            this._linkFinishedTlec(tlecWrapper);
            this._tlecs.push(tlecWrapper);
        },

        canSendMessages: function () {
            return this._tlecs.length > 0;
        },

        sendMessage: function (msg) {
            if (!this.canSendMessages()) { throw new Error("no tlec"); }
            this._tlConnectionFilter.filter(msg);
        },

        _receiveMessage: function (messageData) {
            this._tlConnectionFilter.unfilter(messageData);
        },

        _linkInitial: function () {
            var builder = this._initialTlec;
            if (!builder) { return; }
            builder.on("changed", this._onChanged, this);
            builder.on("offer", this._onInitialOffer, this);
            builder.on("auth", this._onInitialAuth, this);
            builder.on("done", this._onInitialTlecBuilderDone, this);
        },

        _onInitialTlecBuilderDone: function (builder) {
            this._initialTlec = null;
            this._addTlec(builder);
            this._onChanged();
        },

        _onInitialOffer: function (offer) {
            this.offer = offer;
            this._onChanged();
        },

        _onInitialAuth: function (auth) {
            if (auth) {
                this.auth = auth;
                this._onChanged();
            }
        },

        _onMessage: function (msg) {
            this.fire("message", msg);
        },

        _onMessageSend: function (msg) {
            var activeTlec = this._tlecs[0];
            activeTlec.sendMessage(msg);
        }

    });

    export = TlConnection;
