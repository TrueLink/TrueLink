define(function (require, exports, module) {
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

        this.profile = null;
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

        setFactory: function (factory) {
            this._factory = factory;
            this._transport = factory.createTransport();
            this._transport.on("networkPacket", this._onTransportNetworkPacket, this);
        },

        setProfile: function (profile) {
            this.profile = profile;
        },
        init: function () {
            this._initialTlec = this._factory.createTlecBuilder();
            this._initialTlec.build();
            this._linkInitial();
            this._onChanged();
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

            this._initialTlec = context.deserialize(packet.getLink("_initialTlec"), factory.createTlecBuilder, factory);
            this._linkInitial();
            this._tlecs = context.deserialize(packet.getLink("_tlecs"), factory.createTlecBuilder, factory);
            this._tlecs.forEach(this._linkFinishedTlecBuilder, this);
            // all is ready, gimme packets!
            this._transport.openAddr(this.profile, this._addrIns);
        },

        _onTransportNetworkPacket: function (packet) {
            if (this._initialTlec) {
                this._initialTlec.processNetworkPacket(packet);
            }
            this._tlecs.forEach(function (builder) {
                builder.processNetworkPacket(packet);
            });
        },
        _linkFinishedTlecBuilder: function (builder) {
            builder.on("message", this._receiveMessage, this);
            builder.on("networkPacket", this._onNetworkPacket, this);
            builder.on("closeAddrIn", this._onCloseAddrIn, this);
        },

        _unlinkFinishedTlecBuilder: function (builder) {
            builder.off("message", this._receiveMessage, this);
            builder.off("networkPacket", this._onNetworkPacket, this);
            builder.off("closeAddrIn", this._onCloseAddrIn, this);
        },

        _addTlecBuilder: function (builder) {
            this._linkFinishedTlecBuilder(builder);
            this._tlecs.push(builder);
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
            builder.on("openAddrIn", this._onAddrIn, this);
            builder.on("closeAddrIn", this._onCloseAddrIn, this);
            builder.on("networkPacket", this._onNetworkPacket, this);
            builder.on("done", this._onInitialTlecBuilderDone, this);
        },
        _unlinkInitial: function () {
            var builder = this._initialTlec;
            if (!builder) { return; }
            builder.off("changed", this._onChanged, this);
            builder.off("offer", this._onInitialOffer, this);
            builder.off("auth", this._onInitialAuth, this);
            builder.off("openAddrIn", this._onAddrIn, this);
            builder.off("closeAddrIn", this._onCloseAddrIn, this);
            builder.off("networkPacket", this._onNetworkPacket, this);
            builder.off("done", this._onInitialTlecBuilderDone, this);
        },

        _onInitialTlecBuilderDone: function (builder) {
            this._initialTlec = null;
            this._addTlecBuilder(builder);
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

        _onAddrIn: function (addr) {
            var foundIndex = -1;
            this._addrIns.push(addr);
            this._transport.openAddr(this.profile, addr, true);
        },
        _onCloseAddrIn: function (addr) {
            var foundIndex = -1;
            this._addrIns.forEach(function (open, index) {
                if (open.as(Hex).isEqualTo(addr.as(Hex))) {
                    foundIndex = index;
                }
            });
            if (foundIndex !== -1) {
                this._addrIns.splice(foundIndex, 1);
                this._onChanged();
            }
            this._transport.closeAddr(this.profile, addr);
        },

        _onNetworkPacket: function (packet) {
            this._transport.sendNetworkPacket(this.profile, packet);
        },

        _onMessage: function (msg) {
            this.fire("message", msg);
        },

        _onMessageSend: function (msg) {
            var activeTlec = this._tlecs[0];
            activeTlec.sendMessage(msg);
        }

    });



    module.exports = TlConnection;
});