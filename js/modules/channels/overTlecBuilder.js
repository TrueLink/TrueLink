define(["modules/channels/tlkeBuilder",
    "modules/channels/tlhtBuilder",
    "modules/channels/tlecBuilder",
    "modules/data-types/hex"
], function (TlkeBuilder, TlhtBuilder, TlecBuilder, Hex) {
    "use strict";

    function OverTlecBuilder(transport, random) {
        this._defineEvent("message");
        var tlkeBuilder = this.tlkeBuilder = new TlkeBuilder(transport, random);
        tlkeBuilder.on("offer", this.onTlkeOffer, this);
        tlkeBuilder.on("auth", this.onTlkeAuth, this);

        var tlhtBuilder = new TlhtBuilder(transport, random);
        var tlecBuilder = new TlecBuilder(transport, random);

        tlkeBuilder.on("done", tlhtBuilder.build, tlhtBuilder);

        tlhtBuilder.on("done", tlecBuilder.build, tlecBuilder);
        tlecBuilder.on("done", this.onTlecReady, this);
    }

    OverTlecBuilder.prototype = {
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
    };

    return OverTlecBuilder;
});