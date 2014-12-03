"use strict";
var tools = require("modules/tools");
var extend = tools.extend;

var TlkeBuilder = require("../../TlkeBuilder");
var Tlke = require("../../Tlke");

var Tlec = require("../index");

var OverTlecBuilder = require("../../OverTlecBuilder");
var Tlgr = require("Tlgr");
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
    createTlecBuilder: function() {
        return new Tlec.Builder(this);
    },
    createTlecCryptor: function() {
        return new Tlec.Cryptor(this);
    },
    createOverTlecBuilder: function() {
        return new OverTlecBuilder(this);
    },
    createTlke: function() {
        return new Tlke(this);
    },
    createTlht: function() {
        return new Tlec.Tlht(this);
    },
    createTlec: function() {
        return new Tlec.Tlec(this);
    },
    createTlgr: function() {
        return new Tlgr(this);
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