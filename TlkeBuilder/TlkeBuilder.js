define(function (require, exports, module) {
    "use strict";
    var invariant = require("../modules/invariant");
    var tools = require("../modules/tools");
    var eventEmitter = require("../modules/events/eventEmitter");
    var serializable = require("../modules/serialization/serializable");

    var extend = tools.extend;
    var isFunction = tools.isFunction;

    function TlkeBuilder(factory) {
        invariant(factory, "Can be constructed only with factory");
        invariant(isFunction(factory.createTlke), "factory must have createTlke() method");
        invariant(isFunction(factory.createRoute), "factory must have createRoute() method");

        this._defineEvent("changed");
        this._defineEvent("offer");
        this._defineEvent("auth");
        this._defineEvent("done");
        this._defineEvent("networkPacket");
        this._defineEvent("openAddrIn");
        this._defineEvent("closeAddrIn");

        this.factory = factory;
        this._tlke = null;
        this._route = null;
    }

    extend(TlkeBuilder.prototype, eventEmitter, serializable, {

        build: function () {
            this._tlke = this.factory.createTlke();
            this._tlke.init();
            this._route = this.factory.createRoute();
            this._link();
        },

        generate: function () {
            invariant(this._tlke, "TlkeBuilder.build() must be called before TlkeBuilder.generate()");
            this._tlke.generate();
        },
        enterOffer: function (offer) {
            invariant(this._tlke, "TlkeBuilder.build() must be called before TlkeBuilder.enterOffer()");
            this._tlke.enterOffer(offer);
        },
        enterAuth: function (auth) {
            invariant(this._tlke, "TlkeBuilder.build() must be called before TlkeBuilder.enterAuth()");
            this._tlke.enterAuth(auth);
        },
        getTlkeState: function () {
            return this._tlke ? this._tlke.state : null;
        },
        processNetworkPacket: function (packet) {
            if (!this._route) { return; }
            this._route.processNetworkPacket(packet);
        },

        serialize: function (packet, context) {
            packet.setLink("_tlke", context.getPacket(this._tlke));
            packet.setLink("_route", context.getPacket(this._route));
        },
        deserialize: function (packet, context) {
            var factory = this.factory;
            var data = packet.getData();

            this._tlke = context.deserialize(packet.getLink("_tlke"), factory.createTlke, factory);
            this._route = context.deserialize(packet.getLink("_route"), factory.createRoute, factory);

            this._link();
        },

        _link: function () {
            var route = this._route;
            var tlke = this._tlke;

            if (tlke && route) {
                route.on("packet", tlke.processPacket, tlke);
                route.on("networkPacket", this._onRouteNetworkPacket, this);
                route.on("openAddrIn", this._onRouteAddrIn, this);
                route.on("closeAddrIn", this._onRouteCloseAddrIn, this);

                tlke.on("changed", this._onChanged, this);
                tlke.on("packet", route.processPacket, route);
                tlke.on("addr", route.setAddr, route);
                tlke.on("keyReady", this._onTlkeKeyReady, this);
                tlke.on("offer", this._onOffer, this);
                tlke.on("auth", this._onAuth, this);

            }

        },

        _unlink: function () {
            var route = this._route;
            var tlke = this._tlke;

            if (tlke && route) {
                route.off("packet", tlke.processPacket, tlke);
                route.off("networkPacket", this._onRouteNetworkPacket, this);
                route.off("openAddrIn", this._onRouteAddrIn, this);
                route.off("closeAddrIn", this._onRouteCloseAddrIn, this);

                tlke.off("changed", this._onChanged, this);
                tlke.off("packet", route.processPacket, route);
                tlke.off("addr", route.setAddr, route);
                tlke.off("keyReady", this._onTlkeKeyReady, this);
                tlke.off("offer", this._onOffer, this);
                tlke.off("auth", this._onAuth, this);

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
        _onOffer: function (offer) {
            this.fire("offer", offer);
        },
        _onAuth: function (auth) {
            this.fire("auth", auth);
        },
        _onTlkeKeyReady: function (args) {
            this.fire("done", args);
        },
        _onChanged: function () {
            this.fire("changed", this);
        },

        destroy: function () {
            if (this._route) { this._route.destroy(); }
            this._unlink();
            this._tlke = null;
            this._route = null;
        }

    });

    module.exports = TlkeBuilder;
});