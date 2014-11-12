"use strict";
var invariant = require("../modules/invariant");
var tools = require("../modules/tools");
var eventEmitter = require("../modules/events/eventEmitter");
var serializable = require("../modules/serialization/serializable");
var Multivalue = require("../Multivalue").Multivalue;
var Hex = require("../Multivalue/multivalue/hex");

var extend = tools.extend;
var isFunction = tools.isFunction;


function TlhtBuilder(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createTlht), "factory must have createTlht() method");
    invariant(isFunction(factory.createRoute), "factory must have createRoute() method");

    this._defineEvent("changed");
    this._defineEvent("done");
    this._defineEvent("networkPacket");
    this._defineEvent("openAddrIn");
    this._defineEvent("closeAddrIn");

    this._factory = factory;
    this._key = null;
    this._inId = null;
    this._outId = null;
    this._route = null;
    this._tlht = null;
}

extend(TlhtBuilder.prototype, eventEmitter, serializable, {
    build: function (args) {
        var message = "args must be {key: multivalue, inId: multivalue, outId: multivalue}";
        invariant(args, message);
        invariant(args.key instanceof Multivalue, message);
        invariant(args.inId instanceof Multivalue, message);
        invariant(args.outId instanceof Multivalue, message);

        var factory = this._factory;
        this._tlht = factory.createTlht();
        this._route = factory.createRoute();

        this._link();
        this._tlht.init(args.key);
        this._route.setAddr(args);

        this._key = args.key;
        this._inId = args.inId;
        this._outId = args.outId;

        this._tlht.generate();
    },

    processNetworkPacket: function (packet) {
        if (!this._route) { return; }
        this._route.processNetworkPacket(packet);
    },

    serialize: function (packet, context) {
        packet.setLink("_tlht", context.getPacket(this._tlht));
        packet.setLink("_route", context.getPacket(this._route));
        packet.setData({
            key: this._key ? this._key.as(Hex).serialize() : null,
            inId: this._inId ? this._inId.as(Hex).serialize() : null,
            outId: this._outId ? this._outId.as(Hex).serialize() : null
        });
    },
    deserialize: function (packet, context) {
        var factory = this._factory;
        var data = packet.getData();
        this._key = data.key ? Hex.deserialize(data.key) : null;
        this._inId = data.inId ? Hex.deserialize(data.inId) : null;
        this._outId = data.outId ? Hex.deserialize(data.outId) : null;

        this._tlht = context.deserialize(packet.getLink("_tlht"), factory.createTlht, factory);
        this._route = context.deserialize(packet.getLink("_route"), factory.createRoute, factory);
        this._link();
    },

    _link: function () {
        var route = this._route;
        var tlht = this._tlht;

        if (route && tlht) {
            route.on("packet", tlht.processPacket, tlht);
            route.on("networkPacket", this._onRouteNetworkPacket, this);
            route.on("openAddrIn", this._onRouteAddrIn, this);
            route.on("closeAddrIn", this._onRouteCloseAddrIn, this);

            tlht.on("packet", route.processPacket, route);
            tlht.on("htReady", this._onDone, this);
        }
    },

    _unlink: function () {
        var route = this._route;
        var tlht = this._tlht;

        if (route && tlht) {
            route.off("packet", tlht.processPacket, tlht);
            route.off("networkPacket", this._onRouteNetworkPacket, this);
            route.off("openAddrIn", this._onRouteAddrIn, this);
            route.on("closeAddrIn", this._onRouteCloseAddrIn, this);

            tlht.off("packet", route.processPacket, route);
            tlht.off("htReady", this._onDone, this);
        }
    },
    _onRouteAddrIn: function (args) {
        this.fire("openAddrIn", args);
    },
    _onRouteCloseAddrIn: function (args) {
        this.fire("closeAddrIn", args);
    },
    _onRouteNetworkPacket: function (packet) {
        this.fire("networkPacket", packet);
    },
    _onDone: function (args) {
        var result = {
            key: this._key,
            hashStart: args.hashStart,
            hashEnd: args.hashEnd,
            inId: this._inId,
            outId: this._outId
        };
        this.fire("done", result);
    },

    destroy: function () {
        if (this._route) { this._route.destroy(); }
        this._unlink();
        this._key = null;
        this._inId = null;
        this._outId = null;
        this._tlht = null;
        this._route = null;
    }
});

module.exports = TlhtBuilder;

