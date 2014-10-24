    "use strict";
    import modules = require("modules");
    var invariant = modules.invariant;
    import extend = require("../../tools/extend");
    import prototype = require("./prototype");

    var TlkeBuilder = modules.channels.TlkeBuilder;
    var TlhtBuilder = modules.channels.TlhtBuilder;
    var TlecBuilder = modules.channels.TlecBuilder;
    var OverTlecBuilder = modules.channels.OverTlecBuilder;
    var Tlke = modules.channels.Tlke;
    var Tlht = modules.channels.Tlht;
    var Tlec = modules.channels.Tlec;
    var Route = modules.channels.Route;
    import CouchTlec = require("../../models/tlConnection/CouchTlec");


    function TlConnectionFactory(serializer, tlConnection, profile) {
        invariant(serializer, "Can i haz serializer?");
        invariant(tlConnection, "Can i haz tlConnection?");
        this.serializer = serializer;
        this.tlConnection = tlConnection;
        this.profile = profile;
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
            invariant(this.profile.transport, "cannot create CouchTlec: profile.transport is not set");
            var tlecWrapper = new CouchTlec();
            tlecWrapper.setFactory(this);
            tlecWrapper.setTransport(this.profile.transport);
            return this._observed(tlecWrapper);
        },

        createRoute: function () {
            return this._observed(new Route(this));
        }
    });

    export = TlConnectionFactory;
