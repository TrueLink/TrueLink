define(function (require, exports, module) {
    "use strict";
    var invariant = require("../invariant");
    var eventEmitter = require("../events/eventEmitter");
    var serializable = require("../serialization/serializable");
    var tools = require("../tools");
    var Tlke = require("../channels/Tlke");
    var extend = tools.extend;
    var isFunction = tools.isFunction;


    function TlecBuilder(factory) {
        invariant(factory, "Can be constructed only with factory");
        invariant(isFunction(factory.createTlec), "factory must have createTlec() method");
        invariant(isFunction(factory.createRoute), "factory must have createRoute() method");
        invariant(isFunction(factory.createTlkeBuilder), "factory must have createTlkeBuilder() method");
        invariant(isFunction(factory.createTlhtBuilder), "factory must have createTlhtBuilder() method");


        this._defineEvent("changed");
        this._defineEvent("done");
        this._defineEvent("message");
        this._defineEvent("offer");
        this._defineEvent("auth");
        this._defineEvent("openAddrIn");
        this._defineEvent("closeAddrIn");
        this._defineEvent("networkPacket");

        this._factory = factory;
        this._tlec = null;
        this._route = null;
        this._tlkeBuilder = null;
        this._tlhtBuilder = null;
        this.status = null;

    }

    extend(TlecBuilder.prototype, eventEmitter, serializable, {
        build: function () {
            this.status = TlecBuilder.STATUS_NOT_STARTED;
            var factory = this._factory;
            this._tlkeBuilder = factory.createTlkeBuilder();
            this._tlkeBuilder.build();
            this._tlhtBuilder = factory.createTlhtBuilder();
            this._tlec = this._factory.createTlec();
            this._route = this._factory.createRoute();
            this._linkBuilders();
            this._link();
            this._onChanged();
        },

        enterOffer: function (offer) {
            this._tlkeBuilder.enterOffer(offer);
        },

        enterAuth: function (auth) {
            this._tlkeBuilder.enterAuth(auth);
        },

        generateOffer: function () {
            this._tlkeBuilder.generate();
        },

        sendMessage: function (msg) {
            if (!this._tlec) {
                throw new Error("tlec is not yet built");
            }
            this._tlec.sendMessage(msg);
        },

        processNetworkPacket: function (packet) {
            console.log("TlecBuilder got networkPacket: status = " + this.status, packet);
            if (this._route) {
                this._route.processNetworkPacket(packet);
            }
            if (this._tlhtBuilder) {
                this._tlhtBuilder.processNetworkPacket(packet);
            }
            if (this._tlkeBuilder) {
                this._tlkeBuilder.processNetworkPacket(packet);
            }
        },

        serialize: function (packet, context) {
            packet.setData({status: this.status});
            packet.setLink("_tlkeBuilder", context.getPacket(this._tlkeBuilder));
            packet.setLink("_tlhtBuilder", context.getPacket(this._tlhtBuilder));
            packet.setLink("_tlec", context.getPacket(this._tlec));
            packet.setLink("_route", context.getPacket(this._route));
        },
        deserialize: function (packet, context) {
            var factory = this._factory;
            var data = packet.getData();
            this.status = data.status;
            this._tlkeBuilder = context.deserialize(packet.getLink("_tlkeBuilder"), factory.createTlkeBuilder, factory);
            this._tlhtBuilder = context.deserialize(packet.getLink("_tlhtBuilder"), factory.createTlhtBuilder, factory);
            this._tlec = context.deserialize(packet.getLink("_tlec"), factory.createTlec, factory);
            this._route = context.deserialize(packet.getLink("_route"), factory.createRoute, factory);
            this._link();
            this._linkBuilders();
        },

        _link: function () {
            var tlec = this._tlec;
            var route = this._route;

            if (route && tlec) {
                route.on("packet", tlec.processPacket, tlec);
                route.on("networkPacket", this._onNetworkPacket, this);
                route.on("openAddrIn", this._onRouteAddrIn, this);
                route.on("closeAddrIn", this._onRouteCloseAddrIn, this);
                tlec.on("packet", route.processPacket, route);
                tlec.on("message", this._onMessage, this);
            }
        },

        _unlink: function () {
            var tlec = this._tlec;
            var route = this._route;

            if (route && tlec) {
                route.off("packet", tlec.processPacket, tlec);
                route.off("networkPacket", this._onNetworkPacket, this);
                route.off("openAddrIn", this._onRouteAddrIn, this);
                route.off("closeAddrIn", this._onRouteCloseAddrIn, this);
                tlec.off("packet", route.processPacket, route);
            }
        },
        _onRouteAddrIn: function (args) {
            this.fire("openAddrIn", args);
        },
        _onRouteCloseAddrIn: function (args) {
            this.fire("closeAddrIn", args);
        },
        _onNetworkPacket: function (packet) {
            console.log("Sending some packet: ", packet);
            this.fire("networkPacket", packet);
        },
        _onMessage: function (msg) {
            this.fire("message", msg);
        },

        _linkBuilders: function () {
            if (this._tlkeBuilder && this._tlhtBuilder) {
                this._tlkeBuilder.on("offer", this._onOffer, this);
                this._tlkeBuilder.on("auth", this._onAuth, this);
                this._tlkeBuilder.on("done", this._tlhtBuilder.build, this._tlhtBuilder);
                this._tlkeBuilder.on("changed", this._onTlkeBuilderChanged, this);
                this._tlhtBuilder.on("done", this._initTlec, this);
                this._tlkeBuilder.on("networkPacket", this._onNetworkPacket, this);
                this._tlkeBuilder.on("openAddrIn", this._onRouteAddrIn, this);
                this._tlkeBuilder.on("closeAddrIn", this._onRouteCloseAddrIn, this);
                this._tlhtBuilder.on("networkPacket", this._onNetworkPacket, this);
                this._tlhtBuilder.on("openAddrIn", this._onRouteAddrIn, this);
                this._tlhtBuilder.on("closeAddrIn", this._onRouteCloseAddrIn, this);
            }
        },

        _unlinkBuilders: function () {
            if (this._tlkeBuilder && this._tlhtBuilder) {
                this._tlkeBuilder.off("offer", this._onOffer, this);
                this._tlkeBuilder.off("auth", this._onAuth, this);
                this._tlkeBuilder.off("done", this._tlhtBuilder.build, this._tlhtBuilder);
                this._tlkeBuilder.off("changed", this._onTlkeBuilderChanged, this);
                this._tlhtBuilder.off("done", this._initTlec, this);
                this._tlkeBuilder.off("networkPacket", this._onNetworkPacket, this);
                this._tlkeBuilder.off("openAddrIn", this._onRouteAddrIn, this);
                this._tlkeBuilder.off("closeAddrIn", this._onRouteCloseAddrIn, this);
                this._tlhtBuilder.off("networkPacket", this._onNetworkPacket, this);
                this._tlhtBuilder.off("openAddrIn", this._onRouteAddrIn, this);
                this._tlhtBuilder.off("closeAddrIn", this._onRouteCloseAddrIn, this);
            }
        },


        _onOffer: function (offer) {
            this.fire("offer", offer);
        },
        _onAuth: function (auth) {
            this.fire("auth", auth);
        },

        _initTlec: function (args) {
            this._tlec.init(args);
            this._route.setAddr(args);
            this._tlkeBuilder.destroy();
            this._tlhtBuilder.destroy();
            this._unlinkBuilders();
            this._tlhtBuilder = null;
            this._tlkeBuilder = null;
            this.status = TlecBuilder.STATUS_ESTABLISHED;
            this._onChanged();
            this.fire("done", this);
        },

        _onChanged: function () {
            this.fire("changed");
        },

        _onTlkeBuilderChanged: function () {
            switch (this._tlkeBuilder.getTlkeState()) {
            case Tlke.STATE_AWAITING_OFFER_RESPONSE:
                this.status = TlecBuilder.STATUS_OFFER_GENERATED;
                break;
            case Tlke.STATE_AWAITING_AUTH_RESPONSE:
                this.status = TlecBuilder.STATUS_AUTH_GENERATED;
                break;
            case Tlke.STATE_AWAITING_AUTH:
                this.status = TlecBuilder.STATUS_AUTH_NEEDED;
                break;
            case Tlke.STATE_AWAITING_OFFERDATA:
                this.status = TlecBuilder.STATUS_OFFERDATA_NEEDED;
                break;
            case Tlke.STATE_AWAITING_AUTHDATA:
                this.status = TlecBuilder.STATUS_AUTHDATA_NEEDED;
                break;
            case Tlke.STATE_CONNECTION_ESTABLISHED:
                this.status = TlecBuilder.STATUS_HT_EXCHANGE;
                break;
            case Tlke.STATE_CONNECTION_FAILED:
                this.status = TlecBuilder.STATUS_AUTH_ERROR;
                break;
            }
            this._onChanged();
        },

        destroy: function () {
            if (this._route) { this._route.destroy(); }
            if (this._tlhtBuilder) { this._tlhtBuilder.destroy(); }
            if (this._tlkeBuilder) { this._tlkeBuilder.destroy(); }
            this._unlink();
            this._unlinkBuilders();
            this._tlec = null;
            this._route = null;
            this._tlhtBuilder = null;
            this._tlkeBuilder = null;
        }

    });

    TlecBuilder.STATUS_NOT_STARTED = 0;

    // tlke A
    TlecBuilder.STATUS_OFFER_GENERATED = 1;
    TlecBuilder.STATUS_AUTH_GENERATED = 2;
    TlecBuilder.STATUS_AUTH_ERROR = -1;

    // tlke B
    TlecBuilder.STATUS_OFFERDATA_NEEDED = 4;
    TlecBuilder.STATUS_AUTHDATA_NEEDED = 5;
    TlecBuilder.STATUS_AUTH_NEEDED = 6;

    // tlht both
    TlecBuilder.STATUS_HT_EXCHANGE = 3;

    // can send messages now
    TlecBuilder.STATUS_ESTABLISHED = 10;

    module.exports = TlecBuilder;
});