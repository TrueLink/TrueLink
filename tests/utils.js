define(function(require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");

    var TlkeBuilder = require("modules/channels/TlkeBuilder");
    var TlhtBuilder = require("modules/channels/TlhtBuilder");
    var TlecBuilder = require("modules/channels/TlecBuilder");
    var OverTlecBuilder = require("modules/channels/OverTlecBuilder");
    var Tlke = require("modules/channels/Tlke");
    var Tlht = require("modules/channels/Tlht");
    var Tlec = require("modules/channels/Tlec");
    var Route = require("modules/channels/Route");
    var TestTransport = require("modules/channels/TestTransport");
    var Random = require("modules/cryptography/random");

    function TlConnectionFactory() {
        this._transport = null;
    }

    extend(TlConnectionFactory.prototype, {
        createTlkeBuilder: function() {
            return new TlkeBuilder(this);
        },
        createTlhtBuilder: function() {
            return new TlhtBuilder(this);
        },
        createTlecBuilder: function() {
            return new TlecBuilder(this);
        },
        createOverTlecBuilder: function() {
            return new OverTlecBuilder(this);
        },
        createTlke: function() {
            return new Tlke(this);
        },
        createTlht: function() {
            return new Tlht(this);
        },
        createTlec: function() {
            return new Tlec(this);
        },
        // temp solution for smoke testing
        createTransport: function() {
            if (!this._transport) {
                this._transport = new TestTransport();
            }
            return this._transport;
        },

        createRandom: function() {
            return new Random();
        },

        createRoute: function() {
            return new Route(this);
        }
    });

    module.exports = {
        factory: new TlConnectionFactory()
    }
});