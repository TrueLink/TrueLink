define(["zepto",
    "tools/invariant",
    "modules/channels/EventEmitter",
    "modules/channels/Tlht",
    "modules/channels/Route",
    "modules/serialization/packet",
    "modules/data-types/hex"
], function ($, invariant, EventEmitter, Tlht, Route, SerializationPacket, Hex) {
    "use strict";
    function TlhtBuilder(transport, random) {

        invariant(transport, "transport cannot be empty");
        invariant(random, "random cannot be empty");
        this.transport = transport;
        this.random = random;
        this._defineEvent("done");
        this._defineEvent("dirty");
        this.isLinked = false;
    }

    TlhtBuilder.prototype = new EventEmitter();

    $.extend(TlhtBuilder.prototype, {

        build: function (args) {
            this.tlht = new Tlht();
            this.route = new Route();

            this.link();

            this.tlht.init(args.key);
            this.key = args.key;
            this.inId = args.inId;
            this.outId = args.outId;
            this.route.setAddr(args);
            this.tlht.generate();
            this.fire("dirty");
        },

        link: function (args) {
            var tlht = this.tlht;
            var route = this.route;
            var transport = this.transport;

            tlht.setRng(this.random);

            route.on("packet", tlht.processPacket, tlht);
            route.on("networkPacket", transport.sendNetworkPacket, transport);
            route.on("addrIn", transport.openAddr, transport);

            tlht.on("packet", route.processPacket, route);

            transport.on("networkPacket", route.processNetworkPacket, route);
            tlht.on("htReady", this.on_htReady, this);
            this.isLinked = true;
        },

        serialize: function (context) {
            var packet = context.getPacket(this) || new SerializationPacket();
            var data = {
                isLinked: this.isLinked
            };
            if (this.isLinked) {
                $.extend(data, {
                    key: this.key.as(Hex).serialize(),
                    inId: this.inId.as(Hex).serialize(),
                    outId: this.outId.as(Hex).serialize()
                });
                packet.setLinks({
                    tlht: this.tlht.serialize(context),
                    route: this.route.serialize(context)
                });
            }
            packet.setData(data);
            context.setPacket(this, packet);
            return packet;
        },

        _deserialize: function (packet, context) {
            var data = packet.getData();
            this.isLinked = data.isLinked;
            if (this.isLinked) {
                this.tlht = Tlht.deserialize(packet.getLinks().tlht, context, this.random);
                this.route = Route.deserialize(packet.getLinks().route, context);

                this.key = Hex.deserialize(data.key);
                this.inId = Hex.deserialize(data.inId);
                this.outId = Hex.deserialize(data.outId);

                this.link();
            }
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

    TlhtBuilder.deserialize = function (packet, context, transport, random) {
        invariant(packet, "packet is empty");
        invariant(context, "context is empty");
        invariant(transport, "transport is empty");
        invariant(random, "random is empty");
        return context.getObject(packet) || (function () {
            var tlhtBuilder = new TlhtBuilder(transport, random);
            tlhtBuilder._deserialize(packet, context);
            context.setObject(packet, tlhtBuilder);
            return tlhtBuilder;
        }());
    };

    return TlhtBuilder;
});