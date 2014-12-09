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
    this.timeout(2000);

    describe("with builder", function() {
        before(function(done) {
            this.connection = utils.createConnection(done);
 
            this.alice = new utils.Actor("a", "b");
            this.bob = new utils.Actor("b", "a");
            this.alice.linkTlec(this.connection.aliceTlec);
            this.bob.linkTlec(this.connection.bobTlec);

            this.connection.build();
        });

        beforeEach(function() {
            this.alice.history = [];
            this.bob.history = [];
        });

        it("can send messages", function() {
            this.alice.sendMessage("Hi, Bob.");
            this.bob.sendMessage("Hi, Alice.");
            this.alice.sendMessage("How are you doing, Bob?");
            this.bob.sendMessage("I'm sending messages to you over TLEC!!!");
            this.alice.sendMessage("Wow, and how is it?");
            this.bob.sendMessage("It is awesome!!!");
            this.alice.sendMessage("Why?");
            this.bob.sendMessage("Because our conversation now is more secured than ever");

            expect(this.alice.history).to.deep.equal(this.bob.history);
            expect(this.alice.history).to.deep.equal([
                "a: Hi, Bob.",
                "b: Hi, Alice.",
                "a: How are you doing, Bob?",
                "b: I'm sending messages to you over TLEC!!!",
                "a: Wow, and how is it?",
                "b: It is awesome!!!",
                "a: Why?",
                "b: Because our conversation now is more secured than ever"
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
            this.TlecAlgoHashCount = TlhtAlgo.Hashtail.HashCount;
            TlhtAlgo.Hashtail.HashCount = 5;

            this.connection = utils.createConnection(done);
 
            this.alice = new utils.Actor("a", "b");
            this.bob = new utils.Actor("b", "a");
            this.alice.linkTlec(this.connection.aliceTlec);
            this.bob.linkTlec(this.connection.bobTlec);

            this.connection.build();
        });

        after(function () {
            TlhtAlgo.Hashtail.HashCount = this.TlecAlgoHashCount;
        });

        beforeEach(function() {
            this.alice.history = [];
            this.bob.history = [];
        });

        it("can send messages (10 times more)", function() {
            for (var i = 0; i < 10; i++) {
                this.alice.sendMessage("Hi, Bob.");
                this.bob.sendMessage("Hi, Alice.");
                this.alice.sendMessage("How are you doing, Bob?");
                this.bob.sendMessage("I'm sending messages to you over TLEC!!!");
                this.alice.sendMessage("Wow, and how is it?");
                this.bob.sendMessage("It is awesome!!!");
                this.alice.sendMessage("Why?");
                this.bob.sendMessage("Because our conversation now is more secured than ever");
            }

            expect(this.alice.history).to.deep.equal(this.bob.history);

            var expected = [];
            for (var i = 0; i < 10; i++) {
                expected = expected.concat([
                    "a: Hi, Bob.",
                    "b: Hi, Alice.",
                    "a: How are you doing, Bob?",
                    "b: I'm sending messages to you over TLEC!!!",
                    "a: Wow, and how is it?",
                    "b: It is awesome!!!",
                    "a: Why?",
                    "b: Because our conversation now is more secured than ever"
                ]);
            }
            expect(this.alice.history).to.deep.equal(expected);
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
        this.timeout(5000);

        before(function(done) {
            this.connection = utils.createConnection();

            this.alice = new utils.Actor("a", "b");
            this.bob = new utils.Actor("b", "a");
            
            var results = [];
            var success = function() {
                results.push(this);
                if (results.length == 2) done();
            };

            var createOver = function (tlec) {
                var over = utils.factory.createOverTlecBuilder();

                utils.linkTransport(this.connection.transport, over);

                tlec.on("message", function(bytes) {
                    var msg = JSON.parse(bytes.as(Utf8String).value);
                    over.processMessage(msg);
                }, this);
                over.on("message", function(msg) {
                    tlec.sendMessage(new Utf8String(JSON.stringify(msg)));
                }, this);

                over.on("done", success);

                return over;
            }.bind(this);

            this.connection.aliceTlec.on("done", function(tlec) {
                var over = createOver(tlec);
                this.alice.linkTlec(over);
                over.build(false);
            }, this);
            this.connection.bobTlec.on("done", function(tlec) {
                var over = createOver(tlec);
                this.bob.linkTlec(over);
                over.build(true);
            }, this);

            this.connection.build();
        });

        beforeEach(function() {
            this.alice.history = [];
            this.bob.history = [];
        });

        it("can send messages", function() {
            this.alice.sendMessage("Hi, Bob.");
            this.bob.sendMessage("Hi, Alice.");
            this.alice.sendMessage("How are you doing, Bob?");
            this.bob.sendMessage("I'm sending messages to you over TLEC!!!");
            this.alice.sendMessage("Wow, and how is it?");
            this.bob.sendMessage("It is awesome!!!");
            this.alice.sendMessage("Why?");
            this.bob.sendMessage("Because our conversation now is more secured than ever");

            expect(this.alice.history).to.deep.equal(this.bob.history);
            expect(this.alice.history).to.deep.equal([
                "a: Hi, Bob.",
                "b: Hi, Alice.",
                "a: How are you doing, Bob?",
                "b: I'm sending messages to you over TLEC!!!",
                "a: Wow, and how is it?",
                "b: It is awesome!!!",
                "a: Why?",
                "b: Because our conversation now is more secured than ever"
            ]);
        });

    });

});