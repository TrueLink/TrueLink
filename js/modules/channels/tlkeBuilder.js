define(["zepto",
    "tools/invariant",
    "modules/channels/EventEmitter",
    "modules/channels/Tlke",
    "modules/channels/Route"
], function ($, invariant, EventEmitter, Tlke, Route) {
    "use strict";
    function TlkeBuilder(transport, random) {

        invariant(transport, "transport cannot be empty");
        invariant(random, "random cannot be empty");
        this.transport = transport;
        this.random = random;

        this._defineEvent("offer");
        this._defineEvent("auth");
        this._defineEvent("done");
    }

    TlkeBuilder.prototype = new EventEmitter();

    $.extend(TlkeBuilder.prototype, {
        build: function () {
            var tlke = this.tlke = new Tlke();
            tlke.setRng(this.random);
            var route = this.route = new Route();
            var transport = this.transport;

            route.on("packet", tlke.processPacket, tlke);
            route.on("networkPacket", transport.sendNetworkPacket, transport);
            route.on("addrIn", transport.openAddr, transport);

            tlke.on("packet", route.processPacket, route);
            tlke.on("addr", route.setAddr, route);
            tlke.on("keyReady", this.onTlkeKeyReady, this);
            tlke.on("offer", this.onTlkeOffer, this);
            tlke.on("auth", this.onTlkeAuth, this);

            transport.on("networkPacket", route.processNetworkPacket, route);
        },

        generate: function () {
            this.tlke.generate();
        },
        enterOffer: function (offer) {
            this.tlke.enterOffer(offer);
        },
        enterAuth: function (auth) {
            this.tlke.enterAuth(auth);
        },
        onTlkeOffer: function (offer) {
            this.fire("offer", offer);
        },
        onTlkeAuth: function (auth) {
            this.fire("auth", auth);
        },
        onTlkeKeyReady: function (args) {
            this.fire("done", args);
        }

    });

    return TlkeBuilder;
});