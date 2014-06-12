define(function(require, exports, module) {
    "use strict";
    var utils = require("converters/all");
    var Hex = require("modules/multivalue/hex");
    var EventEmitter = require("modules/events/eventEmitter");
    var extend = require("extend");
    var utils = require("./utils");

    var logfunc = function() {
        var args = [this.name].concat(arguments);
        //console.log.apply(console, args);
    }

    describe("True Link Key Exchange", function() {

        function TlkeTestBuilder(name) {
            this.name = name;
            this._defineEvent("networkPacket");
            this._defineEvent("offer");
            this._defineEvent("auth");
            this._defineEvent("addrIn");
        }

        extend(TlkeTestBuilder.prototype, EventEmitter, {
            build: function() {
                var tlke = this.tlke = utils.factory.createTlke();
                var route = this.route = utils.factory.createRoute();

                tlke.init();

                route.on("packet", tlke.processPacket, tlke);
                route.on("networkPacket", this.on_sendPacket, this);
                route.on("addrIn", this.on_addrIn, this);

                tlke.on("packet", route.processPacket, route);
                tlke.on("addr", route.setAddr, route);
                tlke.on("keyReady", this.keyReady, this);
                tlke.on("offer", this.on_requestOffer, this);
                tlke.on("auth", this.on_requestAuth, this);
            },
            processNetworkPacket: function(packet) {
                this._log("processNetworkPacket", packet);
                this.route.processNetworkPacket(packet);
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
            on_sendPacket: function(packet) {
                this._log("on_sendPacket", packet);
                this.fire("networkPacket", packet);
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
            on_addrIn: function(addr) {
                this._log("on_addrIn", addr);
                this.fire("addrIn", addr);
            },
            _log: logfunc
        });

        describe("with route short-circuited", function() {
            before(function() {
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

            it("alice key is ready", function() {
                expect(this.alice.inId).not.to.be.undefined;
                expect(this.alice.outId).not.to.be.undefined;
                expect(this.alice.key).not.to.be.undefined;
            });

            it("bob key is ready", function() {
                expect(this.bob.inId).not.to.be.undefined;
                expect(this.bob.outId).not.to.be.undefined;
                expect(this.bob.key).not.to.be.undefined;
            });

            it("channel ids matched", function() {
                expect(this.alice.inId.as(Hex).isEqualTo(this.bob.outId.as(Hex))).to.be.true;
                expect(this.alice.outId.as(Hex).isEqualTo(this.bob.inId.as(Hex))).to.be.true;
            });

            it("keys are the same", function() {
                expect(this.alice.key.as(Hex).isEqualTo(this.bob.key.as(Hex))).to.be.true;
            });
        });

        describe("with transport", function() {
            before(function() {
                var transport = this.transport = utils.factory.createTransport();
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

            it("alice key is ready", function() {
                expect(this.alice.inId).not.to.be.undefined;
                expect(this.alice.outId).not.to.be.undefined;
                expect(this.alice.key).not.to.be.undefined;
            });

            it("bob key is ready", function() {
                expect(this.bob.inId).not.to.be.undefined;
                expect(this.bob.outId).not.to.be.undefined;
                expect(this.bob.key).not.to.be.undefined;
            });

            it("channel ids matched", function() {
                expect(this.alice.inId.as(Hex).isEqualTo(this.bob.outId.as(Hex))).to.be.true;
                expect(this.alice.outId.as(Hex).isEqualTo(this.bob.inId.as(Hex))).to.be.true;
            });

            it("keys are the same", function() {
                expect(this.alice.key.as(Hex).isEqualTo(this.bob.key.as(Hex))).to.be.true;
            });

        });

        describe("with real builder", function() {
            beforeEach(function() {
                var transport = this.transport = utils.factory.createTransport();
                var alice = this.alice = utils.factory.createTlkeBuilder();
                var bob = this.bob = utils.factory.createTlkeBuilder();

                alice.on("networkPacket", transport.sendNetworkPacket, transport);
                bob.on("networkPacket", transport.sendNetworkPacket, transport);

                alice.on("addrIn", transport.openAddr, transport);
                bob.on("addrIn", transport.openAddr, transport);

                transport.on("networkPacket", alice.processNetworkPacket, alice);
                transport.on("networkPacket", bob.processNetworkPacket, bob);

                alice.on("offer", bob.enterOffer, bob);
                alice.on("auth", function(auth) {
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

            it("alice key is ready", function() {
                expect(this.aliceResult.inId).not.to.be.undefined;
                expect(this.aliceResult.outId).not.to.be.undefined;
                expect(this.aliceResult.key).not.to.be.undefined;
            });

            it("bob key is ready", function() {
                expect(this.bobResult.inId).not.to.be.undefined;
                expect(this.bobResult.outId).not.to.be.undefined;
                expect(this.bobResult.key).not.to.be.undefined;
            });

            it("channel ids matched", function() {
                expect(this.aliceResult.inId.as(Hex).isEqualTo(this.bobResult.outId.as(Hex))).to.be.true;
                expect(this.aliceResult.outId.as(Hex).isEqualTo(this.bobResult.inId.as(Hex))).to.be.true;
            });

            it("keys are the same", function() {
                expect(this.aliceResult.key.as(Hex).isEqualTo(this.bobResult.key.as(Hex))).to.be.true;
            });

        });

    });

});