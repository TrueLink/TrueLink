define(["zepto",
    "tools/invariant",
    "modules/channels/EventEmitter",
    "modules/channels/Tlec",
    "modules/channels/Route",
    "modules/serialization/packet"
], function ($, invariant, EventEmitter, Tlec, Route, SerializationPacket) {
    "use strict";
    function TlecBuilder(transport, random) {

        invariant(transport, "transport cannot be empty");
        invariant(random, "random cannot be empty");
        this.transport = transport;
        this.random = random;
        this._defineEvent("done");
        this._defineEvent("dirty");
        this._defineEvent("message");
        this._defineEvent("expired");
        this.isLinked = true;
    }

    TlecBuilder.prototype = new EventEmitter();

    $.extend(TlecBuilder.prototype, {
        build: function (args) {
            this.tlec = new Tlec();
            this.route = new Route();
            this.link();
            this.tlec.init(args);
            this.route.setAddr(args);
            this._onDirty();
            this.fire("done", this);
        },

        link: function () {
            var transport = this.transport;
            var route = this.route;
            var tlec = this.tlec;
            route.on("packet", tlec.processPacket, tlec);
            route.on("networkPacket", transport.sendNetworkPacket, transport);
            route.on("addrIn", transport.openAddr, transport);
            tlec.on("packet", route.processPacket, route);
            tlec.on("message", this.onTlecMessage, this);
            tlec.on("dirty", this._onDirty, this);
            transport.on("networkPacket", route.processNetworkPacket, route);
            tlec.setRng(this.random);
            this.isLinked = true;
        },

        onTlecExpired: function () {
            this.fire("expired");
        },
        onTlecMessage: function (netData) {
            this.fire("message", netData);
        },

        sendMessage: function (data) {
            this.tlec.sendMessage(data);
        },

        _onDirty: function () {
            this.fire("dirty");
        },

        serialize: function (context) {
            var packet = context.getPacket(this) || new SerializationPacket();
            var data = {
                isLinked: this.isLinked
            };
            if (this.isLinked) {
                packet.setLinks({
                    tlec: this.tlec.serialize(context),
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
                this.tlec = Tlec.deserialize(packet, context);
            }
        }

    });

    TlecBuilder.deserialize = function (packet, context, transport, random) {
        invariant(packet, "packet is empty");
        invariant(context, "context is empty");
        invariant(transport, "transport is empty");
        invariant(random, "random is empty");
        return context.getObject(packet) || (function () {
            var tlecBuilder = new TlecBuilder(transport, random);
            tlecBuilder._deserialize(packet, context);
            context.setObject(packet, tlecBuilder);
            return tlecBuilder;
        }());
    };

    return TlecBuilder;
});