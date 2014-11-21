"use strict";
require("Multivalue").converters.register();
var Hex = require("Multivalue/multivalue/hex");
var EventEmitter = require("modules/events/eventEmitter");
var utils = require("./utils");
var tools = require("modules/tools");
var extend = tools.extend;
var chai = require('chai');
var expect = chai.expect;


var logfunc = function() {
    var args = [this.name].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
}

describe("True Link Hash Tail Exchange", function() {
    function TlkeTestBuilder(name, transport) {
        this.name = "TlkeTestBuilder" + name;
        this._defineEvent("offer");
        this._defineEvent("auth");
        this._defineEvent("done");
        this.transport = transport;
    }
    extend(TlkeTestBuilder.prototype, EventEmitter, {
        build: function() {
            var tlke = this.tlke = utils.factory.createTlke();
            var route = this.route = utils.factory.createRoute();
            var transport = this.transport;

            tlke.init();

            route.on("packet", tlke.processPacket, tlke);
            route.on("networkPacket", transport.sendNetworkPacket, transport);
            route.on("openAddrIn", transport.openAddr, transport);

            tlke.on("packet", route.processPacket, route);
            tlke.on("addr", route.setAddr, route);
            tlke.on("keyReady", this.on_keyReady, this);
            tlke.on("offer", this.on_requestOffer, this);
            tlke.on("auth", this.on_requestAuth, this);

            transport.on("networkPacket", route.processNetworkPacket, route);
        },
        generate: function() {
            this._log("generate");
            this.tlke.generate();
        },
        keyReady: function(args) {
            this._log("keyReady", args);
            this.inId = args.inId;
            this.outId = args.outId;
            this.key = args.key;
        },
        enterOffer: function(offer) {
            this._log("enterOffer", offer);
            this.tlke.enterOffer(offer);
        },
        enterAuth: function(auth) {
            this._log("enterAuth", auth);
            this.tlke.enterAuth(auth);
        },
        on_requestOffer: function(offer) {
            this._log("on_requestOffer", offer);
            this.fire("offer", offer);
        },
        on_requestAuth: function(auth) {
            this._log("on_requestAuth", auth);
            if (auth) {
                this.fire("auth", auth);
            }
        },
        on_keyReady: function(args) {
            this._log("on_keyReady", args);
            this.fire("done", args);
        },
        _log: logfunc
    });

    function TlhtTestBuilder(name, transport) {
        this.name = "TlhtTestBuilder::" + name;
        this._defineEvent("done");
        this.transport = transport;
    }
    extend(TlhtTestBuilder.prototype, EventEmitter, {
        build: function(args) {
            var tlht = this.tlht = utils.factory.createTlht();
            var route = this.route = utils.factory.createRoute();
            var transport = this.transport;

            route.on("packet", tlht.processPacket, tlht);
            route.on("networkPacket", transport.sendNetworkPacket, transport);
            route.on("openAddrIn", transport.openAddr, transport);

            tlht.on("packet", route.processPacket, route);

            transport.on("networkPacket", route.processNetworkPacket, route);
            tlht.on("htReady", this.on_htReady, this);

            tlht.init(args.key);
            route.setAddr(args);
            tlht.generate();
        },
        on_htReady: function(args) {
            this._log("on_htReady", args);
            this.hashStart = this.tlht._algo._myHashes;
            if (this.hashStart) {
                this.hashStart = this.hashStart.map(function (hashInfo) {
                    return {
                        start: hashInfo.start.as(Hex).serialize(),
                        counter: hashInfo.counter
                    }
                });
            }
            this.hashEnd = this.tlht._algo._herHashes;
            if (this.hashEnd) {
                this.hashEnd = this.hashEnd.map(function (hashInfo) {
                    return {
                        end: hashInfo.end.as(Hex).serialize()
                    }
                });
            }
            this._log("hashStart", this.hashStart);
            this._log("hashEnd", this.hashEnd);
            this.fire("done");
        },
        _log: logfunc
    });

    describe("with transport", function() {
        before(function(done) {
            var transport = this.transport = utils.factory.createTransport();
            var aliceTlke = this.aliceTlke = new TlkeTestBuilder("Alice", transport);
            var bobTlke = this.bobTlke = new TlkeTestBuilder("Bob", transport);
            var aliceTlht = this.aliceTlht = new TlhtTestBuilder("Alice", transport);
            var bobTlht = this.bobTlht = new TlhtTestBuilder("Bob", transport);

            aliceTlke.on("offer", bobTlke.enterOffer, bobTlke);
            aliceTlke.on("auth", bobTlke.enterAuth, bobTlke);

            aliceTlke.on("done", aliceTlht.build, aliceTlht);
            bobTlke.on("done", bobTlht.build, bobTlht);

            var results = [];
            var success = function() {
                results.push(this);
                if (results.length == 2) done();
            };

            aliceTlht.on("done", success, aliceTlht);
            bobTlht.on("done", success, bobTlht);

            aliceTlke.build();
            bobTlke.build();
            aliceTlke.generate();
        });

        it("alice hash tails are ready", function() {
            expect(this.aliceTlht.hashStart).not.to.be.undefined;
            expect(this.aliceTlht.hashEnd).not.to.be.undefined;
        });

        it("bob hash tails are ready", function() {
            expect(this.bobTlht.hashStart).not.to.be.undefined;
            expect(this.bobTlht.hashEnd).not.to.be.undefined;
        });

    });

    describe("with builder", function() {
        before(function(done) {
            var transport = this.transport = utils.factory.createTransport();
            var aliceTlke = this.aliceTlke = utils.factory.createTlkeBuilder();
            var bobTlke = this.bobTlke = utils.factory.createTlkeBuilder();
            var aliceTlht = this.aliceTlht = utils.factory.createTlhtBuilder();
            var bobTlht = this.bobTlht = utils.factory.createTlhtBuilder();

            aliceTlke.on("networkPacket", transport.sendNetworkPacket, transport);
            bobTlke.on("networkPacket", transport.sendNetworkPacket, transport);

            aliceTlke.on("openAddrIn", transport.openAddr, transport);
            bobTlke.on("openAddrIn", transport.openAddr, transport);

            transport.on("networkPacket", aliceTlke.processNetworkPacket, aliceTlke);
            transport.on("networkPacket", bobTlke.processNetworkPacket, bobTlke);

            aliceTlht.on("networkPacket", transport.sendNetworkPacket, transport);
            bobTlht.on("networkPacket", transport.sendNetworkPacket, transport);

            aliceTlht.on("openAddrIn", transport.openAddr, transport);
            bobTlht.on("openAddrIn", transport.openAddr, transport);

            transport.on("networkPacket", aliceTlht.processNetworkPacket, aliceTlht);
            transport.on("networkPacket", bobTlht.processNetworkPacket, bobTlht);

            aliceTlke.on("offer", bobTlke.enterOffer, bobTlke);
            aliceTlke.on("auth", function(auth) {
                if (auth) {
                    bobTlke.enterAuth(auth);
                }
            }, null);

            aliceTlke.on("done", aliceTlht.build, aliceTlht);
            bobTlke.on("done", bobTlht.build, bobTlht);

            var results = [];
            var success = function() {
                results.push(this);
                if (results.length == 2) done();
            };

            aliceTlht.on("done", function(args) {
                this.aliceResult = args;
                success();
            }, this);
            bobTlht.on("done", function(args) {
                this.bobResult = args;
                success();
            }, this);

            aliceTlke.build();
            bobTlke.build();
            aliceTlke.generate();
        });

        it("alice hash tails are ready", function() {
            expect(this.aliceTlht._tlht._algo._myHashes).not.to.be.undefined;
            expect(this.aliceTlht._tlht._algo._herHashes).not.to.be.undefined;
        });

        it("bob hash tails are ready", function() {
            expect(this.bobTlht._tlht._algo._myHashes).not.to.be.undefined;
            expect(this.bobTlht._tlht._algo._herHashes).not.to.be.undefined;
        });
    });

}); 