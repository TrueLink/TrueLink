define([
    "tools/random",
    "modules/data-types/Hex",
    "modules/channels/EventEmitter",
    "modules/channels/tlke",
    "modules/channels/tlkeBuilder",
    "modules/channels/tlht",
    "modules/channels/tlhtBuilder",
    "modules/channels/tlec",
    "modules/channels/tlecBuilder",
    "modules/channels/TestTransport",
    "modules/channels/Route",
    "modules/data-types/utf8string",
    "zepto"
], function (random, Hex, EventEmitter, Tlke, TlkeBuilder, Tlht, TlhtBuilder, Tlec, TlecBuilder, Transport, Route, Utf8String, $) {

    var logfunc = function() {
        var args = [this.name].concat(arguments);
        //console.log.apply(console, args);
    }

    describe("True Link Encrypted Channel", function () {

        describe("with builder", function () {
            beforeEach(function () {
                var transport = this.transport = new Transport();
                var aliceTlke = this.aliceTlke = new TlkeBuilder(transport, random);
                var bobTlke = this.bobTlke = new TlkeBuilder(transport, random);
                var aliceTlth = this.aliceTlth = new TlhtBuilder(transport, random);
                var bobTlht = this.bobTlht = new TlhtBuilder(transport, random);
                var aliceTlec = this.aliceTlec = new TlecBuilder(transport, random);
                var bobTlec = this.bobTlec = new TlecBuilder(transport, random);

                aliceTlke.on("offer", bobTlke.enterOffer, bobTlke);
                aliceTlke.on("auth", bobTlke.enterAuth, bobTlke);

                aliceTlke.on("done", aliceTlth.build, aliceTlth);
                bobTlke.on("done", bobTlht.build, bobTlht);

                aliceTlth.on("done", aliceTlec.build, aliceTlec);
                bobTlht.on("done", bobTlec.build, bobTlec);

                this.aliceHistory = [];
                aliceTlec.on("done", function(tlec) {
                    this.aliceTlec = tlec;
                    tlec.on("message", function(bytes) {
                        this.aliceHistory.push(bytes.as(Utf8String).value);
                    }, this);
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
                }, this);
                this.sendMessageFromBob = function(text) {
                    this.bobHistory.push(text);
                    this.bobTlec.sendMessage(new Utf8String(text));
                };

                aliceTlke.build();
                bobTlke.build();
                aliceTlke.generate();
            });

            it("can send messages", function () {
                this.sendMessageFromAlice("Hi, Bob.");
                this.sendMessageFromBob("Hi, Alice.");
                this.sendMessageFromAlice("How are you doing, Bob?");
                this.sendMessageFromBob("I'm sending messages to you over TLEC!!!");
                this.sendMessageFromAlice("Wow, and how is it?");
                this.sendMessageFromBob("It is awesome!!!");
                this.sendMessageFromAlice("Why?");
                this.sendMessageFromBob("Because our conversation now is more secured than ever");

                expect(this.aliceHistory).toEqual(this.bobHistory);
                expect(this.aliceHistory).toEqual([
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
