"use strict";
var invariant = require("invariant");
var eventEmitter = require("modules/events/eventEmitter");
var serializable = require("modules/serialization/serializable");
var tools = require("modules/tools");
var Tlke = require("Tlke");
var extend = tools.extend;
var isFunction = tools.isFunction;

var Multivalue = require("Multivalue").multivalue.Multivalue;
var Hex = require("Multivalue/multivalue/hex");



function TlecBuilder(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createTlec), "factory must have createTlec() method");
    invariant(isFunction(factory.createRoute), "factory must have createRoute() method");
    invariant(isFunction(factory.createTlkeBuilder), "factory must have createTlkeBuilder() method");
    invariant(isFunction(factory.createTlht), "factory must have createTlht() method");


    this._defineEvent("changed");
    this._defineEvent("readyForSync");
    this._defineEvent("done");
    this._defineEvent("message");
    this._defineEvent("offer");
    this._defineEvent("auth");
    this._defineEvent("openAddrIn");
    this._defineEvent("closeAddrIn");
    this._defineEvent("networkPacket");
    this._defineEvent("hashtail");

    this._factory = factory;
    this._tlec = null;
    this._route = null;
    this._tlkeBuilder = null;
    this._tlht = null;
    this._cryptor = null;
    this.status = null;
    this._key = null;
    this._inId = null;
    this._outId = null;
    this._profileId = null;
}

extend(TlecBuilder.prototype, eventEmitter, serializable, {
    build: function (args, sync) {
        if (args && args.profileId) {
            this._profileId = args.profileId;
        }
        var factory = this._factory;
        this._route = factory.createRoute();
        this._tlht = factory.createTlht();
        this._cryptor = factory.createTlecCryptor();
        this._linkRoute();
        this._linkTlht();
        this._linkCryptor();
        if (sync) {
            this.status = TlecBuilder.STATUS_HT_EXCHANGE;
            this._initTlht({
                key: Hex.deserialize(sync.key),
                inId: Hex.deserialize(sync.inId),
                outId: Hex.deserialize(sync.outId)
            }, true);
        } else {
            this.status = TlecBuilder.STATUS_NOT_STARTED;
            this._tlkeBuilder = factory.createTlkeBuilder();
            this._tlkeBuilder.build();
            this._linkTlkeBuilder();
        }
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
        //console.log("TlecBuilder got networkPacket: status = " + this.status, packet);
        if (this._route) {
            this._route.processNetworkPacket(packet);
        }
        if (this._tlkeBuilder) {
            this._tlkeBuilder.processNetworkPacket(packet);
        }
    },

    processHashtail: function (args) {
        return this._tlht.processHashtail(args);
    },

    addCowriter: function (cowriter) {
        this._tlht.addCowriter(cowriter);
    },

    serialize: function (packet, context) {
        packet.setData({
            status: this.status,
            key: this._key ? this._key.as(Hex).serialize() : null,
            inId: this._inId ? this._inId.as(Hex).serialize() : null,
            outId: this._outId ? this._outId.as(Hex).serialize() : null,
            profileId: this._profileId
        });
        packet.setLink("_tlkeBuilder", context.getPacket(this._tlkeBuilder));
        packet.setLink("_tlht", context.getPacket(this._tlht));
        packet.setLink("_tlec", context.getPacket(this._tlec));
        packet.setLink("_route", context.getPacket(this._route));
        packet.setLink("_cryptor", context.getPacket(this._cryptor));
    },
    deserialize: function (packet, context) {
        var factory = this._factory;
        var data = packet.getData();
        this.status = data.status;
        this._key = data.key ? Hex.deserialize(data.key) : null;
        this._inId = data.inId ? Hex.deserialize(data.inId) : null;
        this._outId = data.outId ? Hex.deserialize(data.outId) : null;
        this._profileId = data.profileId;

        
        this._tlkeBuilder = context.deserialize(packet.getLink("_tlkeBuilder"), factory.createTlkeBuilder, factory);
        this._linkTlkeBuilder();

        this._tlht = context.deserialize(packet.getLink("_tlht"), factory.createTlht, factory);
        this._linkTlht();

        this._tlec = context.deserialize(packet.getLink("_tlec"), factory.createTlec, factory);
        this._route = context.deserialize(packet.getLink("_route"), factory.createRoute, factory);
        this._cryptor = context.deserialize(packet.getLink("_cryptor"), factory.createTlecCryptor, factory);
        this._linkRoute();
        this._link();
        this._linkCryptor();
    },

    _linkRoute: function () {
        var route = this._route;

        route.on("networkPacket", this._onNetworkPacket, this);
        route.on("openAddrIn", this._onRouteAddrIn, this);
        route.on("closeAddrIn", this._onRouteCloseAddrIn, this);
    },

    _unlinkRoute: function () {
        var route = this._route;

        route.off("networkPacket", this._onNetworkPacket, this);
        route.off("openAddrIn", this._onRouteAddrIn, this);
        route.off("closeAddrIn", this._onRouteCloseAddrIn, this);
    },

    _link: function () {
        var tlec = this._tlec;
        var route = this._route;

        if (tlec) {
            this._cryptor.on("decrypted", tlec.processPacket, tlec);
            tlec.on("packet", this._cryptor.encrypt, this._cryptor);
            tlec.on("message", this._onMessage, this);
            tlec.on("requestedHash", this._onRequestedHash, this);
            tlec.on("requestedHashCheck", this._onRequestedHashCheck, this);
        }
    },

    _unlink: function () {
        var tlec = this._tlec;
        var route = this._route;

        if (tlec) {
            this._cryptor.off("decrypted", tlec.processPacket, tlec);
            tlec.off("packet", this._cryptor.encrypt, this._cryptor);
            tlec.off("message", this._onMessage, this);
            tlec.off("requestedHash", this._onRequestedHash, this);
            tlec.off("requestedHashCheck", this._onRequestedHashCheck, this);
        }
    },
    _onRequestedHash: function (args) {
        this._tlht.fulfillHashRequest(args);
    },
    _onRequestedHashCheck: function (args) {
        this._tlht.fulfillHashCheckRequest(args);
    },
    _onFulfilledHashRequest: function (args) {
        this._tlec.sendHashedMessage(args);
    },
    _onFulfilledHashCheckRequest: function (args) {
        this._tlec.processCheckedPacket(args);
    },
    
    _onRouteAddrIn: function (args) {
        this.fire("openAddrIn", args);
    },
    _onRouteCloseAddrIn: function (args) {
        this.fire("closeAddrIn", args);
    },
    _onNetworkPacket: function (packet) {
        //console.log("Sending some packet: ", packet);
        this.fire("networkPacket", packet);
    },
    _onMessage: function (msg) {
        this.fire("message", msg);
    },

    _linkTlkeBuilder: function () {
        if (this._tlkeBuilder) {
            this._tlkeBuilder.on("offer", this._onOffer, this);
            this._tlkeBuilder.on("auth", this._onAuth, this);
            this._tlkeBuilder.on("done", this._onTlkeDone, this);
            this._tlkeBuilder.on("changed", this._onTlkeBuilderChanged, this);
            this._tlkeBuilder.on("networkPacket", this._onNetworkPacket, this);
            this._tlkeBuilder.on("openAddrIn", this._onRouteAddrIn, this);
            this._tlkeBuilder.on("closeAddrIn", this._onRouteCloseAddrIn, this);
        }
    },

    _linkTlht: function () {
        var tlht = this._tlht;
        var route = this._route;
        var cryptor = this._cryptor;
        if (tlht) {
            cryptor.on("decrypted", tlht.processPacket, tlht);
            tlht.on("packet", cryptor.encrypt, cryptor);
            tlht.on("htReady", this._initTlec, this);
            tlht.on("fulfilledHashRequest", this._onFulfilledHashRequest, this);
            tlht.on("fulfilledHashCheckRequest", this._onFulfilledHashCheckRequest, this);
            tlht.on("hashtail", this._onHashtail, this);
        }
    },

    _unlinkTlkeBuilder: function () {
        if (this._tlkeBuilder) {
            this._tlkeBuilder.off("offer", this._onOffer, this);
            this._tlkeBuilder.off("auth", this._onAuth, this);
            this._tlkeBuilder.off("done", this._onTlkeDone, this);
            this._tlkeBuilder.off("changed", this._onTlkeBuilderChanged, this);
            this._tlkeBuilder.off("networkPacket", this._onNetworkPacket, this);
            this._tlkeBuilder.off("openAddrIn", this._onRouteAddrIn, this);
            this._tlkeBuilder.off("closeAddrIn", this._onRouteCloseAddrIn, this);
        }
    }, 

    _unlinkTlht: function () {
        var tlht = this._tlht;
        var route = this._route;
        var cryptor = this._cryptor;
        if (tlht) {
            cryptor.off("decrypted", tlht.processPacket, tlht);
            tlht.off("packet", cryptor.encrypt, cryptor);
            tlht.off("htReady", this._initTlec, this);
            tlht.off("fulfilledHashRequest", this._onFulfilledHashRequest, this);
            tlht.off("fulfilledHashCheckRequest", this._onFulfilledHashCheckRequest, this);
            tlht.off("hashtail", this._onHashtail, this);
        }
    },

    _unlinkBuilders: function () {
        this._unlinkTlht();
        this._unlinkTlkeBuilder();
    },

    _linkCryptor: function () {
        this._cryptor.on("encrypted", this._route.processPacket, this._route);
        this._route.on("packet", this._cryptor.decrypt, this._cryptor);
    },
    _unlinkCryptor: function () {
        this._cryptor.off("encrypted", this._route.processPacket, this._route);
        this._route.off("packet", this._cryptor.decrypt, this._cryptor);
    },


    _onOffer: function (offer) {
        this.fire("offer", offer);
    },
    _onAuth: function (auth) {
        this.fire("auth", auth);
    },

    _onTlkeDone: function (args) {
        this._initTlht(args);
    },

    _initTlht: function (args, sync) {
        var message = "args must be {key: multivalue, inId: multivalue, outId: multivalue}";
        invariant(args, message);
        invariant(args.key instanceof Multivalue, message);
        invariant(args.inId instanceof Multivalue, message);
        invariant(args.outId instanceof Multivalue, message);
        
        this._key = args.key;
        this._inId = args.inId;
        this._outId = args.outId;

        args.profileId = this._profileId;
        this._cryptor.init(args);
        this._tlht.init(args, sync);  //TODO 'sync = true' should not be needed here!

        if (!sync) { this._onReadyForSync(args); }
        
        this._route.setAddr(args);

        if (!sync) {
            this._tlht.generate();
        }
    },

    _onReadyForSync: function (args) {
        this.fire("readyForSync", {
            key: args.key.as(Hex).serialize(),
            inId: args.inId.as(Hex).serialize(),
            outId: args.outId.as(Hex).serialize(),
        });        
    },

    _onHashtail: function (args) {
        this.fire("hashtail", args);
    },

    _initTlec: function (args) {
        this._tlec = this._factory.createTlec();
        this._tlec.init({
            key: this._key,
            inId: this._inId,
            outId: this._outId
        });
        this._link();
        if (this._tlkeBuilder) {
            this._tlkeBuilder.destroy();
            this._unlinkTlkeBuilder();
            this._tlkeBuilder = null;
        }
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
        if (this._tlkeBuilder) { this._tlkeBuilder.destroy(); }
        this._unlink();
        this._unlinkBuilders();
        this._unlinkCryptor();
        this._tlec = null;
        this._route = null;
        this._tlht = null;
        this._tlkeBuilder = null;
        this._cryptor.destroy();

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
