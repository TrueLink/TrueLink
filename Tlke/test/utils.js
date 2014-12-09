"use strict";
var tools = require("modules/tools");
var extend = tools.extend;

var TlkeBuilder = require("../../TlkeBuilder/TlkeBuilder");
var Tlke = require("../Tlke");
var Route = require("Route");
var TestTransport = require("TestTransport");
var Random = require("modules/cryptography/random");

function TlConnectionFactory() {
    this._transport = null;
}

extend(TlConnectionFactory.prototype, {
    createTlkeBuilder: function() {
        return new TlkeBuilder(this);
    },
    createTlke: function() {
        return new Tlke(this);
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