    "use strict";
    import modules = require("modules");
    var invariant = modules.invariant;
    import extend = require("../../tools/extend");
    import prototype = require("./prototype");

    import TlkeBuilder = require("TlkeBuilder");
    import TlhtBuilder = require("TlhtBuilder");
    import TlecBuilder = require("TlecBuilder");
    import OverTlecBuilder = require("OverTlecBuilder");
    import Tlke = require("Tlke");
    import Tlht = require("Tlht");
    import Tlec = require("Tlec");
    import Route = require("Route");
    import CouchTlec = require("../../models/tlConnection/CouchTlec");


    function TlConnectionFactory(serializer, tlConnection, transport) {
        invariant(serializer, "Can i haz serializer?");
        invariant(tlConnection, "Can i haz tlConnection?");
        invariant(transport, "Can i haz transport?");
        this.serializer = serializer;
        this.tlConnection = tlConnection;
        this.transport = transport;
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

        createRandom: function () {
            return this.getInstance("Random");
        },

        createCouchTlec: function () {
            var tlecWrapper = new CouchTlec();
            tlecWrapper.setFactory(this);
            tlecWrapper.setTransport(this.transport);
            return this._observed(tlecWrapper);
        },

        createRoute: function () {
            return this._observed(new Route(this));
        }
    });

    export = TlConnectionFactory;
