define(["zepto",
    "tools/invariant",
    "modules/channels/EventEmitter",
    "modules/channels/Tlke",
    "modules/channels/Route",
    "modules/serialization/packet"
], function ($, invariant, EventEmitter, Tlke, Route, SerializationPacket) {
    "use strict";
    function TlkeBuilder(transport, random) {

        invariant(transport, "transport cannot be empty");
        invariant(random, "random cannot be empty");
        this.transport = transport;
        this.random = random;

        this._defineEvent("offer");
        this._defineEvent("auth");
        this._defineEvent("dirty");
        this._defineEvent("done");

        this.isLinked = false;
    }

    TlkeBuilder.prototype = new EventEmitter();

    $.extend(TlkeBuilder.prototype, {

        build: function () {
            this.tlke = new Tlke();
            this.route = new Route();
            this.link();
            this._onDirty();
        },


        _deserialize: function (packet, context) {
            this.isLinked = packet.getData().isLinked;
            if (this.isLinked) {
                this.tlke = Tlke.deserialize(packet.getLinks().tlke, context, this.random);
                this.route = Route.deserialize(packet.getLinks().route, context);
                this.link();
            }
        },

        serialize: function (context) {
            var packet = context.getPacket(this) || new SerializationPacket();
            packet.setData({
                isLinked: this.isLinked
            });
            if (this.isLinked) {
                packet.setLinks({
                    tlke: this.tlke.serialize(context),
                    route: this.route.serialize(context)
                });
            }
            context.setPacket(this, packet);
            return packet;
        },

        link: function () {
            this.tlke.setRng(this.random);
            var transport = this.transport;
            var route = this.route;
            var tlke = this.tlke;

            route.on("packet", tlke.processPacket, tlke);
            route.on("networkPacket", transport.sendNetworkPacket, transport);
            route.on("addrIn", transport.openAddr, transport);

            tlke.on("packet", route.processPacket, route);
            tlke.on("addr", route.setAddr, route);
            tlke.on("keyReady", this.onTlkeKeyReady, this);
            tlke.on("offer", this.onTlkeOffer, this);
            tlke.on("auth", this.onTlkeAuth, this);
            tlke.on("dirty", this._onDirty, this);

            transport.on("networkPacket", route.processNetworkPacket, route);

            this.isLinked = true;
            this._onDirty();
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
        },
        _onDirty: function () {
            this.fire("dirty");
        }

    });

    TlkeBuilder.deserialize = function (packet, context, transport, random) {
        invariant(packet, "packet is empty");
        invariant(context, "context is empty");
        invariant(transport, "transport is empty");
        invariant(random, "random is empty");
        return context.getObject(packet) || (function () {
            var tlkeBuilder = new TlkeBuilder(transport, random);
            tlkeBuilder._deserialize(packet, context);
            context.setObject(packet, tlkeBuilder);
            return tlkeBuilder;
        }());
    };

    return TlkeBuilder;
});