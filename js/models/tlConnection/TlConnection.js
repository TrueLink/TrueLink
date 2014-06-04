define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var Hex = require("modules/multivalue/hex");
    var Tlke = require("modules/channels/Tlke");


    function TlConnection() {
        this._defineEvent("changed");

        this.tlkeBuilder = null;
        this.tlhtBuilder = null;
        this.tlecBuilders = [];
        this.offer = null;
        this.auth = null;
        this.status = null;
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
                this.tlkeBuilder.on("changed", this.onTlkeBuilderChanged, this);
                this.tlhtBuilder.on("done", this.onTlhtDone, this);
            }

        },

        unlink: function () {
            if (this.tlkeBuilder && this.tlhtBuilder) {
                this.tlkeBuilder.off("offer", this.onTlkeOffer, this);
                this.tlkeBuilder.off("auth", this.onTlkeAuth, this);
                this.tlkeBuilder.off("done", this.tlhtBuilder.build, this.tlhtBuilder);
                this.tlkeBuilder.on("changed", this.onTlkeBuilderChanged, this);
                this.tlhtBuilder.off("done", this.onTlhtDone, this);

            }
        },

        onTlkeOffer: function (offer) {
            this.offer = offer;
            this.onChanged();
        },
        onTlkeAuth: function (auth) {
            this.auth = auth;
            this.onChanged();
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
            this.status = TlConnection.STATUS_NOT_STARTED;

            this.onChanged();
        },

        onTlkeBuilderChanged: function () {
            switch (this.tlkeBuilder.getTlkeState()) {
            case Tlke.STATE_AWAITING_OFFER_RESPONSE:
                this.status = TlConnection.STATUS_OFFER_GENERATED;
                break;
            case Tlke.STATE_AWAITING_AUTH:
                this.status = TlConnection.STATUS_AUTH_NEEDED;
                break;
            }
            this.onChanged();
        },

        onTlhtDone: function (result) {
            console.info("TLHT done! ", result);
            this.status = TlConnection.STATUS_ESTABLISHED;
            this.onChanged();
//            var tlecBuilder = this.factory.createTlecBuilder();
        },

        init: function () {
            this.status = TlConnection.STATUS_NOT_STARTED;
        }

    });

//    Start - Offer generated - Auth generated - ht exchange - done
//    Start - Offer accepted - Auth needed - ht exchange - done
    TlConnection.STATUS_NOT_STARTED = 0;

    TlConnection.STATUS_OFFER_GENERATED = 1;
    TlConnection.STATUS_AUTH_GENERATED = 2;
    TlConnection.STATUS_HT_EXCHANGE = 3;

    TlConnection.STATUS_OFFER_ACCEPTED = 4;
    TlConnection.STATUS_AUTH_NEEDED = 5;

    TlConnection.STATUS_ESTABLISHED = 10;

    module.exports = TlConnection;
});