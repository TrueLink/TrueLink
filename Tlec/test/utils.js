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
var Utf8String = require("Multivalue/multivalue/utf8string");


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

var factory = new TlConnectionFactory();

var linkTransport = function (transport, tlec) {
    tlec.on("networkPacket", transport.sendNetworkPacket, transport);
    tlec.on("openAddrIn", transport.openAddr, transport);
    transport.on("networkPacket", tlec.processNetworkPacket, tlec);
}

var createConnection = function (doneCb) {
    var connection = {};
    var transport = connection.transport = factory.createTransport();
    var aliceTlec = connection.aliceTlec = factory.createTlecBuilder();
    var bobTlec = connection.bobTlec = factory.createTlecBuilder();

    linkTransport(transport, bobTlec);
    linkTransport(transport, aliceTlec);

    aliceTlec.on("offer", bobTlec.enterOffer, bobTlec);
    aliceTlec.on("auth", bobTlec.enterAuth, bobTlec);

    if (doneCb) {
        var results = [];
        var success = function() {
            results.push(this);
            if (results.length == 2) doneCb();
        };

        aliceTlec.on("done", success);
        bobTlec.on("done", success);
    }

    connection.build = function () {
        aliceTlec.build();
        bobTlec.build();
        aliceTlec.generateOffer();        
    };

    return connection;
}

var Actor = function (name, otherName) {
    this.name = name;
    this.otherName = otherName;
    this.history = [];
    this.tlec = null;
};

Actor.prototype.sendMessage = function (text) {
    this.history.push(this.name + ": " + text);
    this.tlec.sendMessage(new Utf8String(text));
}

Actor.prototype.linkTlec = function (tlecEmitter) {
    tlecEmitter.on("done", function(tlec) {
        this.tlec = tlec;
        tlec.on("message", function(bytes) {
            this.history.push(this.otherName + ": " + bytes.as(Utf8String).value);
        }, this);
    }, this);    
}

module.exports = {
    factory: factory,
    Actor: Actor,
    linkTransport: linkTransport,
    createConnection: createConnection
}