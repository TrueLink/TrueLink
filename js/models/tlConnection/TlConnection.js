define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var Hex = require("modules/multivalue/hex");
    var Utf8String = require("modules/multivalue/utf8string");
    var TlecBuilder = require("modules/channels/TlecBuilder");


    function TlConnection() {

        this._defineEvent("changed");
        this._defineEvent("message");

        this.offer = null;
        this.auth = null;
        this._initialTlecBuilder = null;
        this._tlecBuilders = [];
    }

    extend(TlConnection.prototype, eventEmitter, serializable, model, {

        setFactory: function (factory) {
            this._factory = factory;
            this._transport = factory.createTransport();
            this._transport.on("networkPacket", this._onTransportNetworkPacket, this);
        },
        init: function () {
            this._initialTlecBuilder = this._factory.createTlecBuilder();
            this._initialTlecBuilder.build();
            this._linkInitial();
            this._onChanged();
        },

        getStatus: function () {
            if (this.canSendMessages()) {
                return TlecBuilder.STATUS_ESTABLISHED;
            }
            return this._initialTlecBuilder ? this._initialTlecBuilder.status : null;
        },
        generateOffer: function () {
            this._initialTlecBuilder.generateOffer();
        },

        enterOffer: function (offer) {
            this._initialTlecBuilder.enterOffer(offer);
        },

        enterAuth: function (auth) {
            this._initialTlecBuilder.enterAuth(auth);
        },

        abortTlke: function () {
            this.offer = null;
            this.auth = null;
            this._initialTlecBuilder.destroy();
            this.init();
        },

        _onTransportNetworkPacket: function (packet) {
            if (this._initialTlecBuilder) {
                this._initialTlecBuilder.processNetworkPacket(packet);
            }
            this._tlecBuilders.forEach(function (builder) {
                builder.processNetworkPacket(packet);
            });
        },
        _linkFinishedTlecBuilder: function (builder) {
            builder.on("message", this._receiveMessage, this);
            builder.on("networkPacket", this._onNetworkPacket, this);
        },

        _unlinkFinishedTlecBuilder: function (builder) {
            builder.off("message", this._receiveMessage, this);
            builder.off("networkPacket", this._onNetworkPacket, this);
        },

        _addTlecBuilder: function (builder) {
            this._linkFinishedTlecBuilder(builder);
            this._tlecBuilders.push(builder);
        },
        canSendMessages: function () {
            return this._tlecBuilders.length > 0;
        },
        _sendMessage: function (msg) {
            if (!this.canSendMessages()) { throw new Error("no tlec"); }
            var activeTlecBuilder = this._tlecBuilders[0];
            var messageData = Utf8String.fromString(JSON.stringify(msg));
            activeTlecBuilder.sendMessage(messageData);
        },
        _receiveMessage: function (messageData) {
            var msg = JSON.parse(messageData.as(Utf8String).toString());
            this.fire("message", msg);
        },

        _linkInitial: function () {
            var builder = this._initialTlecBuilder;
            if (!builder) { return; }
            builder.on("changed", this._onChanged, this);
            builder.on("offer", this._onInitialOffer, this);
            builder.on("auth", this._onInitialAuth, this);
            builder.on("addrIn", this._onInitialAddrIn, this);
            builder.on("networkPacket", this._onNetworkPacket, this);
            builder.on("done", this._onInitialTlecBuilderDone, this);
        },
        _unlinkInitial: function () {
            var builder = this._initialTlecBuilder;
            if (!builder) { return; }
            builder.off("changed", this._onChanged, this);
            builder.off("offer", this._onInitialOffer, this);
            builder.off("auth", this._onInitialAuth, this);
            builder.off("addrIn", this._onInitialAddrIn, this);
            builder.off("networkPacket", this._onNetworkPacket, this);
            builder.off("done", this._onInitialTlecBuilderDone, this);
        },

        _onInitialTlecBuilderDone: function (builder) {
            this._initialTlecBuilder.destroy();
            this._initialTlecBuilder = null;
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

        _onInitialAddrIn: function (addr) {
            this._transport.openAddr(addr);
        },

        _onNetworkPacket: function (packet) {
            this._transport.sendNetworkPacket(packet);
        },

        serialize: function (packet, context) {

            packet.setData({
                offer: this.offer ? this.offer.as(Hex).serialize() : null,
                auth: this.auth ? this.auth.as(Hex).serialize() : null
            });

            packet.setLink("_initialTlecBuilder", context.getPacket(this._initialTlecBuilder));
            packet.setLink("_tlecBuilders", context.getPacket(this._tlecBuilders));
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            var data = packet.getData();

            this.offer = data.offer ? Hex.deserialize(data.offer) : null;
            this.auth = data.auth ? Hex.deserialize(data.auth) : null;

            this._initialTlecBuilder = context.deserialize(packet.getLink("_initialTlecBuilder"), factory.createTlecBuilder.bind(factory));
            this._linkInitial();
            this._tlecBuilders = context.deserialize(packet.getLink("_tlecBuilders"), factory.createTlecBuilder.bind(factory));
            this._tlecBuilders.forEach(this._linkFinishedTlecBuilder, this);
        }

    });



    module.exports = TlConnection;
});