define(["zepto",
    "tools/invariant",
    "modules/channels/EventEmitter",
    "modules/channels/Tlht",
    "modules/channels/Route"
], function ($, invariant, EventEmitter, Tlht, Route) {
    "use strict";
    function TlhtBuilder(transport, random) {

        invariant(transport, "transport cannot be empty");
        invariant(random, "random cannot be empty");
        this.transport = transport;
        this.random = random;

        this._defineEvent("done");
    }

    TlhtBuilder.prototype = new EventEmitter();

    $.extend(TlhtBuilder.prototype, {
        build: function (args) {
            var tlht = this.tlht = new Tlht();
            var route = this.route = new Route();
            var transport = this.transport;

            route.on("packet", tlht.processPacket, tlht);
            route.on("networkPacket", transport.sendNetworkPacket, transport);
            route.on("addrIn", transport.openAddr, transport);

            tlht.on("packet", route.processPacket, route);

            transport.on("networkPacket", route.processNetworkPacket, route);
            tlht.on("htReady", this.on_htReady, this);

            tlht.setRng(this.random);
            tlht.init(args.key);
            this.key = args.key;
            this.inId = args.inId;
            this.outId = args.outId;
            route.setAddr(args);
            tlht.generate();
        },

        on_htReady: function (args) {
            var result = {
                key: this.key,
                hashStart: args.hashStart,
                hashEnd: args.hashEnd,
                inId: this.inId,
                outId: this.outId
            };
            this.fire("done", result);
        }

    });

    return TlhtBuilder;
});