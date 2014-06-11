define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var prototype = require("./prototype");

    var TlkeBuilder = require("modules/channels/TlkeBuilder");
    var TlhtBuilder = require("modules/channels/TlhtBuilder");
    var TlecBuilder = require("modules/channels/TlecBuilder");
    var OverTlecBuilder = require("modules/channels/OverTlecBuilder");
    var Tlke = require("modules/channels/Tlke");
    var Tlht = require("modules/channels/Tlht");
    var Tlec = require("modules/channels/Tlec");
    var Route = require("modules/channels/Route");
    var TestTransport = require("modules/channels/TestTransport");


    function TlConnectionFactory(serializer) {
        invariant(serializer, "Can i haz serializer?");
        this.serializer = serializer;
        this.profile = null;
        this.tlConnection = null;
    }

    extend(TlConnectionFactory.prototype, prototype, {
        setProfile: function (profile) {
            this.profile = profile;
        },

        setTlConnection: function (con) {
            this.tlConnection = con;
        },

        createTlkeBuilder: function () {
            return this._observed(new TlkeBuilder(this));
        },
        createTlhtBuilder: function () {
            return this._observed(new TlhtBuilder(this));
        },
        createTlecBuilder: function () {
            return this._observed(new TlecBuilder(this));
        },

        createOverTlecBuilder: function () {
            var builder = new OverTlecBuilder(this);
            return this._observed(builder);
        },

        createTlke: function () {
            return this._observed(new Tlke(this));
        },
        createTlht: function () {
            return this._observed(new Tlht(this));
        },
        createTlec: function () {
            return this._observed(new Tlec(this));
        },


        // temp solution for smoke testing
        createTransport: function () {
            invariant(this.profile, "profile is not set");
            if (!this.profile._transport) {
                this.profile._transport = new TestTransport();
            }
            return this.profile._transport;
        },

        // temp
        createRandom: function () {
            return this.profile.app.random;
        },

        createRoute: function () {
            return this._observed(new Route(this));
        }
    });

    module.exports = TlConnectionFactory;
});