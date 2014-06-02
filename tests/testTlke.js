define(function (require, exports, module) {
    "use strict";
    var random = require("modules/cryptography/random");
    var Hex = require("modules/multivalue/hex");
    var EventEmitter = require("modules/events/eventEmitter");
    var Tlke = require("modules/channels/tlke");
    var TlkeBuilder = require("modules/channels/TlkeBuilder");
    var Transport =  require("modules/channels/TestTransport");
    var Route = require("modules/channels/Route");
    var extend = require("extend");

    var logfunc = function() {
        var args = [this.name].concat(arguments);
        //console.log.apply(console, args);
    }

    describe("True Link Key Exchange", function () {

        function TlkeTestBuilder(name) {
            this.name = name;
            this._defineEvent("networkPacket");
            this._defineEvent("offer");
            this._defineEvent("auth");
            this._defineEvent("addrIn");
        }
        TlkeTestBuilder.prototype = new EventEmitter();
        extend(TlkeTestBuilder.prototype, {
            build: function () {
                var tlke = this.tlke = new Tlke();
                tlke.setRng(random);
                var route = this.route = new Route();

                route.on("packet", tlke.processPacket, tlke);
                route.on("networkPacket", this.on_sendPacket, this);
                route.on("addrIn", this.on_addrIn, this);

                tlke.on("packet", route.processPacket, route);
                tlke.on("addr", route.setAddr, route);
                tlke.on("keyReady", this.keyReady, this);
                tlke.on("offer", this.on_requestOffer, this);
                tlke.on("auth", this.on_requestAuth, this);
            },
            processNetworkPacket: function (packet) {
                this._log("processNetworkPacket", packet);
                this.route.processNetworkPacket(packet);
            },
            generate: function () {
                this._log("generate");
                this.tlke.generate();
            },
            keyReady: function (args) {
                this._log("keyReady", args);
                this.inId = args.inId;
                this.outId = args.outId;
                this.key = args.key;
            },
            enterOffer: function (offer) {
                this._log("enterOffer", offer);
                this.tlke.enterOffer(offer);
            },
            enterAuth: function (auth) {
                this._log("enterAuth", auth);
                this.tlke.enterAuth(auth);
            },
            on_sendPacket: function (packet) {
                this._log("on_sendPacket", packet);
                this.fire("networkPacket", packet);
            },
            on_requestOffer: function (offer) {
                this._log("on_requestOffer", offer);
                this.fire("offer", offer);
            },
            on_requestAuth: function (auth) {
                this._log("on_requestAuth", auth);
                if (auth) {
                    this.fire("auth", auth);
                }
            },
            on_addrIn: function (addr) {
                this._log("on_addrIn", addr);
                this.fire("addrIn", addr);
            },
            _log: logfunc
        });

        describe("with route short-circuited", function () {
            beforeEach(function () {
                var alice = this.alice = new TlkeTestBuilder("Alice");
                var bob = this.bob = new TlkeTestBuilder("Bob");
                alice.on("networkPacket", bob.processNetworkPacket, bob);
                bob.on("networkPacket", alice.processNetworkPacket, alice);

                alice.on("offer", bob.enterOffer, bob);
                alice.on("auth", bob.enterAuth, bob);

                alice.build();
                bob.build();
                alice.generate();
            });

            it("alice key is ready", function () {
                expect(this.alice.inId).not.toBeUndefined();
                expect(this.alice.outId).not.toBeUndefined();
                expect(this.alice.key).not.toBeUndefined();
            });

            it("bob key is ready", function () {
                expect(this.bob.inId).not.toBeUndefined();
                expect(this.bob.outId).not.toBeUndefined();
                expect(this.bob.key).not.toBeUndefined();
            });

            it("channel ids matched", function () {
                expect(this.alice.inId.as(Hex).isEqualTo(this.bob.outId.as(Hex))).toBe(true);
                expect(this.alice.outId.as(Hex).isEqualTo(this.bob.inId.as(Hex))).toBe(true);
            });

            it("keys are the same", function () {
                expect(this.alice.key.as(Hex).isEqualTo(this.bob.key.as(Hex))).toBe(true);
            });
        });

        describe("with transport", function () {
            beforeEach(function () {
                var transport = this.transport = new Transport();
                var alice = this.alice = new TlkeTestBuilder("Alice");
                var bob = this.bob = new TlkeTestBuilder("Bob");
                alice.on("networkPacket", transport.sendNetworkPacket, transport);
                bob.on("networkPacket", transport.sendNetworkPacket, transport);

                alice.on("addrIn", transport.openAddr, transport);
                bob.on("addrIn", transport.openAddr, transport);

                transport.on("networkPacket", alice.processNetworkPacket, alice);
                transport.on("networkPacket", bob.processNetworkPacket, bob);

                alice.on("offer", bob.enterOffer, bob);
                alice.on("auth", bob.enterAuth, bob);

                alice.build();
                bob.build();
                alice.generate();
            });

            it("alice key is ready", function () {
                expect(this.alice.inId).not.toBeUndefined();
                expect(this.alice.outId).not.toBeUndefined();
                expect(this.alice.key).not.toBeUndefined();
            });

            it("bob key is ready", function () {
                expect(this.bob.inId).not.toBeUndefined();
                expect(this.bob.outId).not.toBeUndefined();
                expect(this.bob.key).not.toBeUndefined();
            });

            it("channel ids matched", function () {
                expect(this.alice.inId.as(Hex).isEqualTo(this.bob.outId.as(Hex))).toBe(true);
                expect(this.alice.outId.as(Hex).isEqualTo(this.bob.inId.as(Hex))).toBe(true);
            });

            it("keys are the same", function () {
                expect(this.alice.key.as(Hex).isEqualTo(this.bob.key.as(Hex))).toBe(true);
            });

        });

        describe("with real builder", function () {
            beforeEach(function () {
                var transport = this.transport = new Transport();
                var alice = this.alice = new TlkeBuilder(transport, random);
                var bob = this.bob = new TlkeBuilder(transport, random);

                alice.on("offer", bob.enterOffer, bob);
                alice.on("auth", function (auth) {
                    if (auth) {
                        bob.enterAuth(auth);
                    }
                }, null);

                alice.on("done", function(args) {
                    this.aliceResult = args;
                }, this);

                bob.on("done", function(args) {
                    this.bobResult = args;
                }, this);

                alice.build();
                bob.build();
                alice.generate();
            });

            it("alice key is ready", function () {
                expect(this.aliceResult.inId).not.toBeUndefined();
                expect(this.aliceResult.outId).not.toBeUndefined();
                expect(this.aliceResult.key).not.toBeUndefined();
            });

            it("bob key is ready", function () {
                expect(this.bobResult.inId).not.toBeUndefined();
                expect(this.bobResult.outId).not.toBeUndefined();
                expect(this.bobResult.key).not.toBeUndefined();
            });

            it("channel ids matched", function () {
                expect(this.aliceResult.inId.as(Hex).isEqualTo(this.bobResult.outId.as(Hex))).toBe(true);
                expect(this.aliceResult.outId.as(Hex).isEqualTo(this.bobResult.inId.as(Hex))).toBe(true);
            });

            it("keys are the same", function () {
                expect(this.aliceResult.key.as(Hex).isEqualTo(this.bobResult.key.as(Hex))).toBe(true);
            });

        });

    });

});
