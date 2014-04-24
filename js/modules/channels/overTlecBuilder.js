define(["modules/channels/tlkeBuilder",
    "modules/channels/tlhtBuilder",
    "modules/channels/tlecBuilder",
    "modules/channels/EventEmitter",
    "modules/data-types/hex",
    "zepto"
], function (TlkeBuilder, TlhtBuilder, TlecBuilder, EventEmitter, Hex, $) {
    "use strict";

    function OverTlecBuilder(transport, random) {
        this._defineEvent("message");
        this._defineEvent("done");
        this.transport = transport;
        this.random = random;
    }

    OverTlecBuilder.prototype = new EventEmitter();
    $.extend(OverTlecBuilder.prototype, {
        build: function (gen) {
            var tlkeBuilder = this.tlkeBuilder = new TlkeBuilder(this.transport, this.random);
            tlkeBuilder.on("offer", this.onTlkeOffer, this);
            tlkeBuilder.on("auth", this.onTlkeAuth, this);

            var tlhtBuilder = new TlhtBuilder(this.transport, this.random);
            var tlecBuilder = new TlecBuilder(this.transport, this.random);

            tlkeBuilder.on("done", tlhtBuilder.build, tlhtBuilder);

            tlhtBuilder.on("done", tlecBuilder.build, tlecBuilder);
            tlecBuilder.on("done", this.onTlecReady, this);

            tlkeBuilder.build();
            if (gen) { tlkeBuilder.generate(); }
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
        }
    });

    return OverTlecBuilder;
});