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
    var TransportAdapter = require("models/tlConnection/TransportAdapter");
    var TlecSuite = require("models/tlConnection/TlecSuite");


    function TlConnectionFactory(serializer, tlConnection) {
        invariant(serializer, "Can i haz serializer?");
        invariant(tlConnection, "Can i haz tlConnection?");
        this.serializer = serializer;
        this.tlConnection = tlConnection;
    }

    extend(TlConnectionFactory.prototype, prototype, {
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


        createTransport: function () {
            return this.getInstance("Transport");
        },

        createRandom: function () {
            return this.getInstance("Random");
        },

        createTransportAdapter: function () {
            var adapter = new TransportAdapter();
            return this._observed(adapter);
        },

        createTlecSuite: function () {
            var suite = new TlecSuite();
            suite.setFactory(this);
            return this._observed(suite);
        },

        createRoute: function () {
            return this._observed(new Route(this));
        }
    });

    module.exports = TlConnectionFactory;
});