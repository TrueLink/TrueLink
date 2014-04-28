define(["modules/channels/tlkeBuilder",
    "modules/channels/tlhtBuilder",
    "modules/channels/tlecBuilder",
    "modules/channels/EventEmitter",
    "modules/data-types/hex",
    "zepto",
    "modules/serialization/packet"
], function (TlkeBuilder, TlhtBuilder, TlecBuilder, EventEmitter, Hex, $, SerializationPacket) {
    "use strict";

    function OverTlecBuilder(transport, random) {
        this._defineEvent("message");
        this._defineEvent("done");
        this.transport = transport;
        this.random = random;
        this.isLinked = false;
    }

    OverTlecBuilder.prototype = new EventEmitter();
    $.extend(OverTlecBuilder.prototype, {


        build: function (gen) {
            this.tlkeBuilder = new TlkeBuilder(this.transport, this.random);
            this.tlhtBuilder = new TlhtBuilder(this.transport, this.random);
            this.tlecBuilder = new TlecBuilder(this.transport, this.random);

            this.link();

            this.tlkeBuilder.build();
            if (gen) { this.tlkeBuilder.generate(); }
            this._onDirty();
        },

        link: function () {
            var tlkeBuilder = this.tlkeBuilder;
            var tlecBuilder = this.tlecBuilder;
            var tlhtBuilder = this.tlhtBuilder;

            tlkeBuilder.on("offer", this.onTlkeOffer, this);
            tlkeBuilder.on("auth", this.onTlkeAuth, this);

            tlkeBuilder.on("done", tlhtBuilder.build, tlhtBuilder);

            tlhtBuilder.on("done", tlecBuilder.build, tlecBuilder);
            tlecBuilder.on("done", this.onTlecReady, this);

            tlkeBuilder.on("dirty", this._onDirty, this);
            tlhtBuilder.on("dirty", this._onDirty, this);
            tlecBuilder.on("dirty", this._onDirty, this);

            this.linked = true;
        },

        serialize: function (context) {
            var packet = context.getPacket(this) || new SerializationPacket();

            packet.setData({isLinked: this.isLinked});
            if (this.isLinked) {
                packet.setLinks({
                    tlkeBuilder: this.tlkeBuilder.serialize(context),
                    tlhtBuilder: this.tlhtBuilder.serialize(context),
                    tlecBuilder: this.tlecBuilder.serialize(context)
                });
            }

            context.setPacket(this, packet);
            return packet;
        },

        _deserialize: function (packet, context) {
            var data = packet.getData();

            if (data.isLinked) {
                this.tlkeBuilder = TlkeBuilder.deserialize(packet, context, this.transport, this.random);
                this.tlhtBuilder = TlhtBuilder.deserialize(packet, context, this.transport, this.random);
                this.tlecBuilder = TlecBuilder.deserialize(packet, context, this.transport, this.random);

                this.link();
            }

        },

        onTlkeOffer: function (offer) {
            this._sendMessage({t: "o", o: offer.as(Hex).serialize() });
        },
        onTlkeAuth: function (auth) {
            if (auth) {
                this._sendMessage({t: "a", a: auth.as(Hex).serialize() });
            }
        },
        _sendMessage: function (msg) {
            this.fire("message", msg);
        },
        onTlecReady: function (tlec) {
            this.fire("done", tlec);
        },
        processMessage: function (msg) {
            if (msg.t === "o" && msg.o) {
                this.tlkeBuilder.enterOffer(Hex.deserialize(msg.o));
            } else if (msg.t === "a" && msg.a) {
                this.tlkeBuilder.enterAuth(Hex.deserialize(msg.a));
            }
        },

        _onDirty: function () { this.fire("dirty"); }
    });

    OverTlecBuilder.deserialize = function (packet, context, transport, random) {
        invariant(packet, "packet is empty");
        invariant(context, "context is empty");
        invariant(transport, "transport is empty");
        invariant(random, "random is empty");
        return context.getObject(packet) || (function () {
            var overTlecBuilder = new OverTlecBuilder(transport, random);
            overTlecBuilder._deserialize(packet, context);
            context.setObject(packet, overTlecBuilder);
            return overTlecBuilder;
        }());
    };
    return OverTlecBuilder;
});