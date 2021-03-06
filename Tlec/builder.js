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



function Builder(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createTlec), "factory must have createTlec() method");
    invariant(isFunction(factory.createRoute), "factory must have createRoute() method");
    invariant(isFunction(factory.createTlkeBuilder), "factory must have createTlkeBuilder() method");
    invariant(isFunction(factory.createTlht), "factory must have createTlht() method");


    this._defineEvent("changed");
    this._defineEvent("readyForSync");
    this._defineEvent("done");
    this._defineEvent("message");
    this._defineEvent("echo");
    this._defineEvent("offer");
    this._defineEvent("auth");
    this._defineEvent("openAddrIn");
    this._defineEvent("closeAddrIn");
    this._defineEvent("networkPacket");
    this._defineEvent("hashtail");

    this._factory = factory;
    this._tlec = null;
    this._route = null;
    this._echoRoute = null; // one should never use this route to send a thing!!1
    this._tlkeBuilder = null;
    this._tlht = null;
    this._cryptor = null;
    this.status = null;
    this._key = null;
    this._inId = null;
    this._outId = null;
    this._profileId = null;
}

extend(Builder.prototype, eventEmitter, serializable, {
    build: function (args, sync) {
        if (args && args.profileId) {
            this._profileId = args.profileId;
        }
        var factory = this._factory;
        this._route = factory.createRoute();
        this._echoRoute = factory.createRoute();
        this._tlht = factory.createTlht();
        this._cryptor = factory.createTlecCryptor();
        this._tlec = this._factory.createTlec();
        this._link();
        if (sync) {
            this.status = Builder.STATUS_HT_EXCHANGE;
            this._initTlht({
                key: Hex.deserialize(sync.key),
                inId: Hex.deserialize(sync.inId),
                outId: Hex.deserialize(sync.outId)
            }, true);
        } else {
            this.status = Builder.STATUS_NOT_STARTED;
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
        this._tlec.sendMessage(msg);
    },

    processNetworkPacket: function (packet) {
        //console.log("Builder got networkPacket: status = " + this.status, packet);
        if (this._route) {
            this._route.processNetworkPacket(packet);
        }
        if (this._echoRoute) {
            this._echoRoute.processNetworkPacket(packet);
        }
        if (this._tlkeBuilder) {
            this._tlkeBuilder.processNetworkPacket(packet);
        }
    },

    processHashtail: function (args) {
        this._tlht.processHashtail(args);
    },

    addCowriter: function (cowriter) {
        this._tlht.addCowriter(cowriter);
    },

    canAddCowriter: function () {
        // it is to early to add cowriter when tlke is not done
        return !!this._key;
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
        packet.setLink("_echoRoute", context.getPacket(this._echoRoute));
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
        this._tlec = context.deserialize(packet.getLink("_tlec"), factory.createTlec, factory);
        this._route = context.deserialize(packet.getLink("_route"), factory.createRoute, factory);
        this._echoRoute = context.deserialize(packet.getLink("_echoRoute"), factory.createRoute, factory);
        this._cryptor = context.deserialize(packet.getLink("_cryptor"), factory.createTlecCryptor, factory);
        this._link();
    },

    _link: function () {
        var tlec = this._tlec;
        var route = this._route;
        var echoRoute = this._echoRoute;
        var tlht = this._tlht;
        var cryptor = this._cryptor;


        // dataflow:
        // user message goes to hasher
        tlec.on("messageToSend", tlht.hash, tlht);
        // same as hashtail message
        tlht.on("messageToSend", tlht.hash, tlht);
        // gets _stringified_(!) hashed and goes to cryptor
        tlht.on("hashed", cryptor.encrypt, cryptor);
        // gets encrypted and goes to route to be sent
        cryptor.on("encrypted", route.processPacket, route);
        // and then gets sent
        route.on("networkPacket", this._onNetworkPacket, this);

        // packet from network goes to cryptor signed as non-echo
        route.on("packet", this._onRoutePacket, this);
        // if ok, gets decrypted and goes to hash checker
        cryptor.on("decrypted", tlht.unhash, tlht);
        // if ok, gets unhashed and _parsed_(!)
        // and goes back to tlht to be processed as hashtail
        tlht.on("unhashed", tlht.processMessage, tlht);
        // and at the sane time -- to tlec
        tlht.on("unhashed", tlec.processMessage, tlec);
        // if ok -- gets fired as user message
        tlec.on("messageToProcess", this._onMessage, this);

        // echo packet from network goes to cryptor signed as echo
        echoRoute.on("packet", this._onEchoRoutePacket, this);


        // misc
        route.on("openAddrIn", this._onRouteAddrIn, this);
        route.on("closeAddrIn", this._onRouteCloseAddrIn, this);
        echoRoute.on("openAddrIn", this._onRouteAddrIn, this);
        echoRoute.on("closeAddrIn", this._onRouteCloseAddrIn, this);

        tlht.on("htReady", this._initTlec, this);
        tlht.on("hashtail", this._onHashtail, this);
    },

    _unlink: function () {
        var tlec = this._tlec;
        var route = this._route;
        var echoRoute = this._echoRoute;
        var tlht = this._tlht;
        var cryptor = this._cryptor;


        tlec.off("messageToSend", tlht.hash, tlht);
        tlht.off("messageToSend", tlht.hash, tlht);
        tlht.off("hashed", cryptor.encrypt, cryptor);
        cryptor.off("encrypted", route.processPacket, route);
        route.off("networkPacket", this._onNetworkPacket, this);

        route.off("packet", this._onRoutePacket, this);
        cryptor.off("decrypted", tlht.unhash, tlht);
        tlht.off("unhashed", tlht.processMessage, tlht);
        tlht.off("unhashed", tlec.processMessage, tlec);
        tlec.off("messageToProcess", this._onMessage, this);

        echoRoute.off("packet", this._onEchoRoutePacket, this);


        route.off("openAddrIn", this._onRouteAddrIn, this);
        route.off("closeAddrIn", this._onRouteCloseAddrIn, this);
        echoRoute.off("openAddrIn", this._onRouteAddrIn, this);
        echoRoute.off("closeAddrIn", this._onRouteCloseAddrIn, this);

        tlht.off("htReady", this._initTlec, this);
        tlht.off("hashtail", this._onHashtail, this);
    },

    _processPacket: function (isEcho, data) {
        this._cryptor.decrypt({
            isEcho: isEcho,
            data: data
        });
    },

    _onRoutePacket: function (bytes) {
        this._processPacket(false, bytes);
    },

    _onEchoRoutePacket: function (bytes) {
        this._processPacket(true, bytes);
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

    _onMessage: function (args) {
        //console.log("tlec.Builder._onMessage", args);
        if (args.isEcho) {
            this.fire("echo", args.data);
        } else {
            this.fire("message", args.data);
        }
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
        this._echoRoute.setAddr({
            inId: args.outId,
            outId: args.inId
        });

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
        this.status = Builder.STATUS_ESTABLISHED;
        this._onChanged();
        this.fire("done", this);
    },

    _onChanged: function () {
        this.fire("changed");
    },

    _onTlkeBuilderChanged: function () {
        switch (this._tlkeBuilder.getTlkeState()) {
        case Tlke.STATE_AWAITING_OFFER_RESPONSE:
            this.status = Builder.STATUS_OFFER_GENERATED;
            break;
        case Tlke.STATE_AWAITING_AUTH_RESPONSE:
            this.status = Builder.STATUS_AUTH_GENERATED;
            break;
        case Tlke.STATE_AWAITING_AUTH:
            this.status = Builder.STATUS_AUTH_NEEDED;
            break;
        case Tlke.STATE_AWAITING_OFFERDATA:
            this.status = Builder.STATUS_OFFERDATA_NEEDED;
            break;
        case Tlke.STATE_AWAITING_AUTHDATA:
            this.status = Builder.STATUS_AUTHDATA_NEEDED;
            break;
        case Tlke.STATE_CONNECTION_ESTABLISHED:
            this.status = Builder.STATUS_HT_EXCHANGE;
            break;
        case Tlke.STATE_CONNECTION_FAILED:
            this.status = Builder.STATUS_AUTH_ERROR;
            break;
        }
        this._onChanged();
    },

    destroy: function () {
        if (this._route) { this._route.destroy(); }
        if (this._echoRoute) { this._echoRoute.destroy(); }
        if (this._tlkeBuilder) { this._tlkeBuilder.destroy(); }
        this._cryptor.destroy();
        this._unlink();
        this._unlinkTlkeBuilder();
        this._tlec = null;
        this._route = null;
        this._echoRoute = null;
        this._tlht = null;
        this._cryptor = null;
        this._tlkeBuilder = null;        
    }

});

Builder.STATUS_NOT_STARTED = 0;

// tlke A
Builder.STATUS_OFFER_GENERATED = 1;
Builder.STATUS_AUTH_GENERATED = 2;
Builder.STATUS_AUTH_ERROR = -1;

// tlke B
Builder.STATUS_OFFERDATA_NEEDED = 4;
Builder.STATUS_AUTHDATA_NEEDED = 5;
Builder.STATUS_AUTH_NEEDED = 6;

// tlht both
Builder.STATUS_HT_EXCHANGE = 3;

// can send messages now
Builder.STATUS_ESTABLISHED = 10;

module.exports = Builder;
