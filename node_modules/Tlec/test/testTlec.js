"use strict";
require("Multivalue").converters.register();
var Hex = require("Multivalue/multivalue/hex");
var Utf8String = require("Multivalue/multivalue/utf8string");
var EventEmitter = require("modules/events/eventEmitter");
var utils = require("./utils");
var TlhtAlgo = require("../tlht-algo");

var chai = require('chai');
var expect = chai.expect;

var logfunc = function() {
    var args = [this.name].concat(arguments);
    //console.log.apply(console, args);
}

describe("True Link Encrypted Channel", function() {
    this.timeout(10000);

    describe("with builder", function() {
        before(function(done) {
            var transport = this.transport = utils.factory.createTransport();
            var aliceTlec = this.aliceTlec = utils.factory.createTlecBuilder();
            var bobTlec = this.bobTlec = utils.factory.createTlecBuilder();

            aliceTlec.on("networkPacket", transport.sendNetworkPacket, transport);
            bobTlec.on("networkPacket", transport.sendNetworkPacket, transport);

            aliceTlec.on("openAddrIn", transport.openAddr, transport);
            bobTlec.on("openAddrIn", transport.openAddr, transport);

            transport.on("networkPacket", aliceTlec.processNetworkPacket, aliceTlec);
            transport.on("networkPacket", bobTlec.processNetworkPacket, bobTlec);

            aliceTlec.on("offer", bobTlec.enterOffer, bobTlec);
            aliceTlec.on("auth", bobTlec.enterAuth, bobTlec);

            var results = [];
            var success = function() {
                results.push(this);
                if (results.length == 2) done();
            };

            aliceTlec.on("done", function(tlec) {
                this.aliceTlec = tlec;
                tlec.on("message", function(bytes) {
                    this.aliceHistory.push(bytes.as(Utf8String).value);
                }, this);
                success();
            }, this);
            this.sendMessageFromAlice = function(text) {
                this.aliceHistory.push(text);
                this.aliceTlec.sendMessage(new Utf8String(text));
            };

            bobTlec.on("done", function(tlec) {
                this.bobTlec = tlec;
                tlec.on("message", function(bytes) {
                    this.bobHistory.push(bytes.as(Utf8String).value);
                }, this);
                success();
            }, this);
            this.sendMessageFromBob = function(text) {
                this.bobHistory.push(text);
                this.bobTlec.sendMessage(new Utf8String(text));
            };

            aliceTlec.build();
            bobTlec.build();
            aliceTlec.generateOffer();
        });

        beforeEach(function() {
            this.aliceHistory = [];
            this.bobHistory = [];
        });

        it("can send messages", function() {
            this.sendMessageFromAlice("Hi, Bob.");
            this.sendMessageFromBob("Hi, Alice.");
            this.sendMessageFromAlice("How are you doing, Bob?");
            this.sendMessageFromBob("I'm sending messages to you over TLEC!!!");
            this.sendMessageFromAlice("Wow, and how is it?");
            this.sendMessageFromBob("It is awesome!!!");
            this.sendMessageFromAlice("Why?");
            this.sendMessageFromBob("Because our conversation now is more secured than ever");

            expect(this.aliceHistory).to.deep.equal(this.bobHistory);
            expect(this.aliceHistory).to.deep.equal([
                "Hi, Bob.",
                "Hi, Alice.",
                "How are you doing, Bob?",
                "I'm sending messages to you over TLEC!!!",
                "Wow, and how is it?",
                "It is awesome!!!",
                "Why?",
                "Because our conversation now is more secured than ever"
            ]);
        });

        it.skip("can send long messages (16k)", function() {
            var message="-"
            while(message.length < 10000) {
                message = message + "|" + message;
            }
            this.sendMessageFromAlice(message);
            expect(this.aliceHistory).to.deep.equal(this.bobHistory);
            expect(this.aliceHistory).to.deep.equal([message]);
        });

        it.skip("can send many messages (100)", function() {
            for(var i=0; i<100; i++) {
                this.sendMessageFromAlice("message #" + i);
            }
            expect(this.aliceHistory).to.deep.equal(this.bobHistory);
        });
    });

    describe("multihashtail (TlecAlgo.HashCount = 5)", function() {
        before(function(done) {
            this.TlecAlgoHashCount = TlhtAlgo.HashCount;
            TlhtAlgo.HashCount = 5;

            var transport = this.transport = utils.factory.createTransport();
            var aliceTlec = this.aliceTlec = utils.factory.createTlecBuilder();
            var bobTlec = this.bobTlec = utils.factory.createTlecBuilder();

            aliceTlec.on("networkPacket", transport.sendNetworkPacket, transport);
            bobTlec.on("networkPacket", transport.sendNetworkPacket, transport);

            aliceTlec.on("openAddrIn", transport.openAddr, transport);
            bobTlec.on("openAddrIn", transport.openAddr, transport);

            transport.on("networkPacket", aliceTlec.processNetworkPacket, aliceTlec);
            transport.on("networkPacket", bobTlec.processNetworkPacket, bobTlec);

            aliceTlec.on("offer", bobTlec.enterOffer, bobTlec);
            aliceTlec.on("auth", bobTlec.enterAuth, bobTlec);

            var results = [];
            var success = function() {
                results.push(this);
                if (results.length == 2) done();
            };

            aliceTlec.on("done", function(tlec) {
                this.aliceTlec = tlec;
                tlec.on("message", function(bytes) {
                    this.aliceHistory.push(bytes.as(Utf8String).value);
                }, this);
                success();
            }, this);
            this.sendMessageFromAlice = function(text) {
                this.aliceHistory.push(text);
                this.aliceTlec.sendMessage(new Utf8String(text));
            };

            bobTlec.on("done", function(tlec) {
                this.bobTlec = tlec;
                tlec.on("message", function(bytes) {
                    this.bobHistory.push(bytes.as(Utf8String).value);
                }, this);
                success();
            }, this);
            this.sendMessageFromBob = function(text) {
                this.bobHistory.push(text);
                this.bobTlec.sendMessage(new Utf8String(text));
            };

            aliceTlec.build();
            bobTlec.build();
            aliceTlec.generateOffer();
        });

        after(function () {
            TlhtAlgo.HashCount = this.TlecAlgoHashCount;
        });

        beforeEach(function() {
            this.aliceHistory = [];
            this.bobHistory = [];
        });

        it("can send messages (10 times more)", function() {
            for (var i = 0; i < 10; i++) {
                this.sendMessageFromAlice("Hi, Bob.");
                this.sendMessageFromBob("Hi, Alice.");
                this.sendMessageFromAlice("How are you doing, Bob?");
                this.sendMessageFromBob("I'm sending messages to you over TLEC!!!");
                this.sendMessageFromAlice("Wow, and how is it?");
                this.sendMessageFromBob("It is awesome!!!");
                this.sendMessageFromAlice("Why?");
                this.sendMessageFromBob("Because our conversation now is more secured than ever");
            }

            expect(this.aliceHistory).to.deep.equal(this.bobHistory);

            var expected = [];
            for (var i = 0; i < 10; i++) {
                expected = expected.concat([
                    "Hi, Bob.",
                    "Hi, Alice.",
                    "How are you doing, Bob?",
                    "I'm sending messages to you over TLEC!!!",
                    "Wow, and how is it?",
                    "It is awesome!!!",
                    "Why?",
                    "Because our conversation now is more secured than ever"
                ]);
            }
            expect(this.aliceHistory).to.deep.equal(expected);
        });

        it.skip("can send long messages (16k)", function() {
            var message="-"
            while(message.length < 10000) {
                message = message + "|" + message;
            }
            this.sendMessageFromAlice(message);
            expect(this.aliceHistory).to.deep.equal(this.bobHistory);
            expect(this.aliceHistory).to.deep.equal([message]);
        });

        it.skip("can send many messages (100)", function() {
            for(var i=0; i<100; i++) {
                this.sendMessageFromAlice("message #" + i);
            }
            expect(this.aliceHistory).to.deep.equal(this.bobHistory);
        });
    });

    describe("tlec over tlec", function() {
        before(function(done) {
            var transport = this.transport = utils.factory.createTransport();
            var aliceTlec = this.aliceTlec = utils.factory.createTlecBuilder();
            var bobTlec = this.bobTlec = utils.factory.createTlecBuilder();

            aliceTlec.on("networkPacket", transport.sendNetworkPacket, transport);
            bobTlec.on("networkPacket", transport.sendNetworkPacket, transport);

            aliceTlec.on("openAddrIn", transport.openAddr, transport);
            bobTlec.on("openAddrIn", transport.openAddr, transport);

            transport.on("networkPacket", aliceTlec.processNetworkPacket, aliceTlec);
            transport.on("networkPacket", bobTlec.processNetworkPacket, bobTlec);

            aliceTlec.on("offer", bobTlec.enterOffer, bobTlec);
            aliceTlec.on("auth", bobTlec.enterAuth, bobTlec);

            var results = [];
            var success = function() {
                results.push(this);
                if (results.length == 2) done();
            };

            aliceTlec.on("done", function(tlec) {
                //console.log("alice building over", tlec);
                var over = utils.factory.createOverTlecBuilder();

                over.on("networkPacket", transport.sendNetworkPacket, transport);
                over.on("openAddrIn", transport.openAddr, transport);
                transport.on("networkPacket", over.processNetworkPacket, over);

                aliceTlec.on("message", function(bytes) {
                    var msg = JSON.parse(bytes.as(Utf8String).value);
                    over.processMessage(msg);
                });
                over.on("message", function(msg) {
                    aliceTlec.sendMessage(new Utf8String(JSON.stringify(msg)));
                });
                over.on("done", function(tlec2) {
                    //console.log("alice !!!!", tlec2);
                    this.aliceNewTlec = tlec2;
                    tlec2.on("message", function(bytes) {
                        this.aliceHistory.push(bytes.as(Utf8String).value);
                    }, this);
                    success();
                }, this);
                over.build(false);
            }, this);
            bobTlec.on("done", function(tlec) {
                //console.log("bob building over", tlec);
                var over = utils.factory.createOverTlecBuilder();

                over.on("networkPacket", transport.sendNetworkPacket, transport);
                over.on("openAddrIn", transport.openAddr, transport);
                transport.on("networkPacket", over.processNetworkPacket, over);

                bobTlec.on("message", function(bytes) {
                    var msg = JSON.parse(bytes.as(Utf8String).value);
                    over.processMessage(msg);
                });
                over.on("message", function(msg) {
                    bobTlec.sendMessage(new Utf8String(JSON.stringify(msg)));
                });
                over.on("done", function(tlec2) {
                    //console.log("bob !!!!", tlec2);
                    this.bobNewTlec = tlec2;
                    tlec2.on("message", function(bytes) {
                        this.bobHistory.push(bytes.as(Utf8String).value);
                    }, this);
                    success();
                }, this);
                over.build(true);
            }, this);

            this.sendMessageFromAlice = function(text) {
                this.aliceHistory.push(text);
                this.aliceNewTlec.sendMessage(new Utf8String(text));
            };
            this.sendMessageFromBob = function(text) {
                this.bobHistory.push(text);
                this.bobNewTlec.sendMessage(new Utf8String(text));
            };

            aliceTlec.build();
            bobTlec.build();
            aliceTlec.generateOffer();
        });

        beforeEach(function() {
            this.aliceHistory = [];
            this.bobHistory = [];
        });

        it("can send messages", function() {
            this.sendMessageFromAlice("Hi, Bob.");
            this.sendMessageFromBob("Hi, Alice.");
            this.sendMessageFromAlice("How are you doing, Bob?");
            this.sendMessageFromBob("I'm sending messages to you over TLEC!!!");
            this.sendMessageFromAlice("Wow, and how is it?");
            this.sendMessageFromBob("It is awesome!!!");
            this.sendMessageFromAlice("Why?");
            this.sendMessageFromBob("Because our conversation now is more secured than ever");

            expect(this.aliceHistory).to.deep.equal(this.bobHistory);
            expect(this.aliceHistory).to.deep.equal([
                "Hi, Bob.",
                "Hi, Alice.",
                "How are you doing, Bob?",
                "I'm sending messages to you over TLEC!!!",
                "Wow, and how is it?",
                "It is awesome!!!",
                "Why?",
                "Because our conversation now is more secured than ever"
            ]);
        });

    });

});