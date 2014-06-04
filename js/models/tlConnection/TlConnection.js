define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var Hex = require("modules/multivalue/hex");


    function TlConnection() {
        this._defineEvent("changed");

        this.tlkeBuilder = null;
        this.tlhtBuilder = null;
        this.tlecBuilders = [];
        this.offer = null;
        this.auth = null;
    }

    extend(TlConnection.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {

            packet.setData({
                offer: this.offer ? this.offer.as(Hex).serialize() : null,
                auth: this.auth ? this.auth.as(Hex).serialize() : null
            });
            packet.setLink("tlkeBuilder", context.getPacket(this.tlkeBuilder));
            packet.setLink("tlhtBuilder", context.getPacket(this.tlhtBuilder));

        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this.factory;
            var data = packet.getData();

            this.offer = data.offer ? Hex.deserialize(data.offer) : null;
            this.auth = data.auth ? Hex.deserialize(data.auth) : null;

            this.tlkeBuilder = context.deserialize(packet.getLink("tlkeBuilder"), factory.createTlkeBuilder.bind(factory));
            this.tlhtBuilder = context.deserialize(packet.getLink("tlhtBuilder"), factory.createTlhtBuilder.bind(factory));


            this.link();
        },

        link: function () {

            if (this.tlkeBuilder && this.tlhtBuilder) {
                this.tlkeBuilder.on("offer", this.onTlkeOffer, this);
                this.tlkeBuilder.on("auth", this.onTlkeAuth, this);
                this.tlkeBuilder.on("done", this.tlhtBuilder.build, this.tlhtBuilder);
                this.tlkeBuilder.on("changed", this.onChanged, this);
                this.tlhtBuilder.on("done", this.onTlhtDone, this);
            }

        },

        unlink: function () {
            if (this.tlkeBuilder && this.tlhtBuilder) {
                this.tlkeBuilder.off("offer", this.onTlkeOffer, this);
                this.tlkeBuilder.off("auth", this.onTlkeAuth, this);
                this.tlkeBuilder.off("done", this.tlhtBuilder.build, this.tlhtBuilder);
                this.tlkeBuilder.on("changed", this.onChanged, this);
                this.tlhtBuilder.off("done", this.onTlhtDone, this);

            }
        },

        onTlkeOffer: function (offer) {
            this.offer = offer;
            this._onChanged();
        },
        onTlkeAuth: function (auth) {
            this.auth = auth;
            this._onChanged();
        },

        generateOffer: function () {
            if (this.tlkeBuilder || this.tlhtBuilder) {
                throw new Error("Already connecting");
            }
            this.tlkeBuilder = this.factory.createTlkeBuilder();
            this.tlkeBuilder.build();
            this.tlhtBuilder = this.factory.createTlhtBuilder();
            this.link();
            this.tlkeBuilder.generate();
        },

        getTlkeState: function () {
            return this.tlkeBuilder ? this.tlkeBuilder.getTlkeState() : null;
        },

        enterOffer: function (offer) {
            if (!this.tlkeBuilder) {
                this.tlkeBuilder = this.factory.createTlkeBuilder();
                this.tlkeBuilder.build();
                this.tlhtBuilder = this.factory.createTlhtBuilder();
                this.link();
                this.tlkeBuilder.enterOffer(offer);
            }
        },

        enterAuth: function (auth) {
            if (this.tlkeBuilder) {
                this.tlkeBuilder.enterAuth(auth);
            }
        },

        abortTlke: function () {
            this.unlink();
            if (this.tlkeBuilder) {
                this.tlkeBuilder.destroy();
                this.tlkeBuilder = null;
            }
            if (this.tlhtBuilder) {
                this.tlhtBuilder.destroy();
                this.tlhtBuilder = null;
            }
            this.offer = null;
            this.auth = null;
            this.onChanged();
        },

        onTlhtDone: function (result) {
            console.info("TLHT done! ", result);
//            var tlecBuilder = this.factory.createTlecBuilder();
        },

        init: function () {
        },

        _onChanged: function () {
            this.fire("changed", this);
        }

    });

    TlConnection.STATUS_NOT_STARTED = 0;

    module.exports = TlConnection;
});