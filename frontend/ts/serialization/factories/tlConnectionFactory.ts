    "use strict";
    import modules = require("modules");
    import invariant = require("invariant");
    import extend = require("../../tools/extend");
    import prototype = require("./prototype");

    import Tlec = require("Tlec");
        
    import TlkeBuilder = require("TlkeBuilder");
    import OverTlecBuilder = require("OverTlecBuilder");
    import Tlke = require("Tlke");
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
        createTlecBuilder: function () {
            return this._observed(new Tlec.Builder(this));
        },

        createOverTlecBuilder: function () {
            var builder = new OverTlecBuilder(this);
            return this._observed(builder);
        },

        createTlke: function () {
            return this._observed(new Tlke(this));
        },
        createTlht: function () {
            return this._observed(new Tlec.Tlht(this));
        },
        createTlec: function () {
            return this._observed(new Tlec.Tlec(this));
        },
        createTlecCryptor: function () {
            return this._observed(new Tlec.Cryptor(this));
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
