define(function(require, exports, module) {
    "use strict";
    var utils = require("converters/all");
    var Hex = require("modules/multivalue/hex");
    var Utf8String = require("modules/multivalue/utf8string");
    var EventEmitter = require("modules/events/eventEmitter");
    var extend = require("extend");
    var utils = require("./utils");

    var logfunc = function() {
        var args = [this.name].concat(arguments);
        //console.log.apply(console, args);
    }

    describe("True Link Encrypted Channel", function() {

        describe("with builder", function() {
            before(function(done) {
                var transport = this.transport = utils.factory.createTransport();
                var aliceTlec = this.aliceTlec = utils.factory.createTlecBuilder();
                var bobTlec = this.bobTlec = utils.factory.createTlecBuilder();

                aliceTlec.on("networkPacket", transport.sendNetworkPacket, transport);
                bobTlec.on("networkPacket", transport.sendNetworkPacket, transport);

                aliceTlec.on("addrIn", transport.openAddr, transport);
                bobTlec.on("addrIn", transport.openAddr, transport);

                transport.on("networkPacket", aliceTlec.processNetworkPacket, aliceTlec);
                transport.on("networkPacket", bobTlec.processNetworkPacket, bobTlec);

                aliceTlec.on("offer", bobTlec.enterOffer, bobTlec);
                aliceTlec.on("auth", bobTlec.enterAuth, bobTlec);

                var results = [];
                var success = function() {
                    results.push(this);
                    if (results.length == 2) done();
                };

                this.aliceHistory = [];
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

                this.bobHistory = [];
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

        describe("tlec over tlec", function() {
            before(function(done) {
                var transport = this.transport = utils.factory.createTransport();
                var aliceTlec = this.aliceTlec = utils.factory.createTlecBuilder();
                var bobTlec = this.bobTlec = utils.factory.createTlecBuilder();

                aliceTlec.on("networkPacket", transport.sendNetworkPacket, transport);
                bobTlec.on("networkPacket", transport.sendNetworkPacket, transport);

                aliceTlec.on("addrIn", transport.openAddr, transport);
                bobTlec.on("addrIn", transport.openAddr, transport);

                transport.on("networkPacket", aliceTlec.processNetworkPacket, aliceTlec);
                transport.on("networkPacket", bobTlec.processNetworkPacket, bobTlec);

                aliceTlec.on("offer", bobTlec.enterOffer, bobTlec);
                aliceTlec.on("auth", bobTlec.enterAuth, bobTlec);

                var results = [];
                var success = function() {
                    results.push(this);
                    if (results.length == 2) done();
                };

                this.aliceHistory = [];
                aliceTlec.on("done", function(tlec) {
                    console.log("alice building over", tlec);
                    var over = utils.factory.createOverTlecBuilder();

                    over.on("networkPacket", transport.sendNetworkPacket, transport);
                    over.on("addrIn", transport.openAddr, transport);
                    transport.on("networkPacket", over.processNetworkPacket, over);

                    aliceTlec.on("message", function(bytes) {
                        var msg = JSON.parse(bytes.as(Utf8String).value);
                        over.processMessage(msg);
                    });
                    over.on("message", function(msg) {
                        aliceTlec.sendMessage(new Utf8String(JSON.stringify(msg)));
                    });
                    over.on("done", function(tlec2) {
                        console.log("alice !!!!", tlec2);
                        this.aliceNewTlec = tlec2;
                        tlec2.on("message", function(bytes) {
                            this.aliceHistory.push(bytes.as(Utf8String).value);
                        }, this);
                        success();
                    }, this);
                    over.build(false);
                }, this);
                this.bobHistory = [];
                bobTlec.on("done", function(tlec) {
                    console.log("bob building over", tlec);
                    var over = utils.factory.createOverTlecBuilder();

                    over.on("networkPacket", transport.sendNetworkPacket, transport);
                    over.on("addrIn", transport.openAddr, transport);
                    transport.on("networkPacket", over.processNetworkPacket, over);

                    bobTlec.on("message", function(bytes) {
                        var msg = JSON.parse(bytes.as(Utf8String).value);
                        over.processMessage(msg);
                    });
                    over.on("message", function(msg) {
                        bobTlec.sendMessage(new Utf8String(JSON.stringify(msg)));
                    });
                    over.on("done", function(tlec2) {
                        console.log("bob !!!!", tlec2);
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

});