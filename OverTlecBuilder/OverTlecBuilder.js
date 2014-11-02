"use strict";
var invariant = require("../modules/invariant");
var eventEmitter = require("../modules/events/eventEmitter");
var serializable = require("../modules/serialization/serializable");
var Hex = require("../modules/multivalue/hex");
var tools = require("../modules/tools");
var extend = tools.extend;
var isFunction = tools.isFunction;
//    var wrapperFactory = require("./wrapperFactory");


function OverTlecBuilder(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createTlecBuilder), "factory must have createTlecBuilder() method");

    this._defineEvent("changed");
    this._defineEvent("message");
    this._defineEvent("networkPacket");
    this._defineEvent("openAddrIn");
    this._defineEvent("closeAddrIn");
    this._defineEvent("done");
    
    this._factory = factory;
//        this.offerWrapper = wrapperFactory.createTypeWrapper("offer");
//        this.authWrapper = wrapperFactory.createTypeWrapper("auth");
    this._tlecBuilder = null;
}

extend(OverTlecBuilder.prototype, eventEmitter, serializable, {
    build: function (gen) {
        this._tlecBuilder = this._factory.createTlecBuilder();
        this._link();
        this._tlecBuilder.build();
        if (gen) { this._tlecBuilder.generateOffer(); }
        this._onChanged();
    },

    processMessage: function (msg) {
        if (msg.t === "o" && msg.o) {
            this._tlecBuilder.enterOffer(Hex.deserialize(msg.o));
        } else if (msg.t === "a" && msg.a) {
            this._tlecBuilder.enterAuth(Hex.deserialize(msg.a));
        }
    },

    processNetworkPacket: function (packet) {
        invariant(this._tlecBuilder, "OverTlecBuilder.build() must be called before processNetworkPacket()");
        this._tlecBuilder.processNetworkPacket(packet);
    },

    serialize: function (packet, context) {
        packet.setLink("_tlecBuilder", context.getPacket(this._tlecBuilder));
    },
    deserialize: function (packet, context) {
        this.checkFactory();
        var factory = this._factory;
        var data = packet.getData();
        this._tlecBuilder = context.deserialize(packet.getLink("_tlecBuilder"), factory.createTlkeBuilder, factory);
        this._link();
    },

    _link: function () {
        var tlecBuilder = this._tlecBuilder;

        if (tlecBuilder) {
            tlecBuilder.on("offer", this._onOffer, this);
            tlecBuilder.on("auth", this._onAuth, this);
            tlecBuilder.on("done", this._onTlecReady, this);
            tlecBuilder.on("networkPacket", this._onTlecNetworkPacket, this);
            tlecBuilder.on("openAddrIn", this._onTlecAddrIn, this);
            tlecBuilder.on("closeAddrIn", this._onTlecCloseAddrIn, this);
        }
    },

    _unlink: function () {
        var tlecBuilder = this._tlecBuilder;

        if (tlecBuilder) {
            tlecBuilder.off("offer", this._onOffer, this);
            tlecBuilder.off("auth", this._onAuth, this);
            tlecBuilder.off("done", this._onTlecReady, this);
            tlecBuilder.off("networkPacket", this._onTlecNetworkPacket, this);
            tlecBuilder.off("openAddrIn", this._onTlecAddrIn, this);
            tlecBuilder.off("closeAddrIn", this._onTlecCloseAddrIn, this);
        }
    },
    _onOffer: function (offer) {
        this._onMessage({t: "o", o: offer.as(Hex).serialize() });
    },
    _onAuth: function (auth) {
        if (auth) {
            this._onMessage({t: "a", a: auth.as(Hex).serialize() });
        }
    },
    _onMessage: function (msg) {
        this.fire("message", msg);
    },
    _onTlecReady: function (tlecBuilder) {
        this.fire("done", tlecBuilder);
    },

    _onChanged: function () {
        this.fire("changed", this);
    },

    _onTlecNetworkPacket: function (packet) {
        this.fire("networkPacket", packet);
    },

    _onTlecAddrIn: function (args) {
        this.fire("openAddrIn", args);
    },

    _onTlecCloseAddrIn: function (args) {
        this.fire("closeAddrIn", args);
    },

    destroy: function () {
        this._unlink();
        this._tlecBuilder.destroy();
        this._tlecBuilder = null;
    }

});

module.exports = OverTlecBuilder;