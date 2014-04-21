define(["zepto",
    "tools/invariant",
    "modules/channels/EventEmitter",
    "modules/channels/Tlec",
    "modules/channels/Route"
], function ($, invariant, EventEmitter, Tlec, Route) {
    "use strict";
    function TlecBuilder(transport, random) {

        invariant(transport, "transport cannot be empty");
        invariant(random, "random cannot be empty");
        this.transport = transport;
        this.random = random;

        this._defineEvent("done");
    }

    TlecBuilder.prototype = new EventEmitter();

    $.extend(TlecBuilder.prototype, {
        build: function (args) {
            console.log("build");
            var tlec = new Tlec();
            var route = this.route = new Route();
            var transport = this.transport;

            route.on("packet", tlec.processPacket, tlec);
            route.on("networkPacket", transport.sendNetworkPacket, transport);
            route.on("addrIn", transport.openAddr, transport);

            tlec.on("packet", route.processPacket, route);

            transport.on("networkPacket", route.processNetworkPacket, route);

            tlec.setRng(this.random);
            tlec.init(args);
            route.setAddr(args);

            this.fire("done", tlec);
        }

    });

    return TlecBuilder;
});