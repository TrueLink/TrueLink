define([
    "tools/random",
    "modules/data-types/Hex",
    "modules/channels/EventEmitter",
    "modules/channels/tlke",
    "modules/channels/tlht",
    "modules/channels/TestTransport",
    "modules/channels/Route",
    "zepto"
], function (random, Hex, EventEmitter, Tlke, Tlht, Transport, Route, $) {

    describe("True Link Key Exchange", function () {

        function Builder(name) {
            this.name = name;
            this._defineEvent("networkPacket");
            this._defineEvent("offer");
            this._defineEvent("auth");
            this._defineEvent("addrIn");
        }
        Builder.prototype = new EventEmitter();
        $.extend(Builder.prototype, {
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
            _log: function () {
                //console.log(this.name, arguments);
            }
        });

        describe("with route short-circuited", function () {
            beforeEach(function () {
                var alice = this.alice = new Builder("Alice");
                var bob = this.bob = new Builder("Bob");
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
                var alice = this.alice = new Builder("Alice");
                var bob = this.bob = new Builder("Bob");
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

    });

    describe("True Link Hash Tail Exchange", function () {

        function TlkeBuilder(name, transport) {
            this.name = "TlkeBuilder" + name;
            this._defineEvent("offer");
            this._defineEvent("auth");
            this._defineEvent("done");
            this.transport = transport;
        }
        TlkeBuilder.prototype = new EventEmitter();
        $.extend(TlkeBuilder.prototype, {
            build: function () {
                var tlke = this.tlke = new Tlke();
                tlke.setRng(random);
                var route = this.route = new Route();
                var transport = this.transport;

                route.on("packet", tlke.processPacket, tlke);
                route.on("networkPacket", transport.sendNetworkPacket, transport);
                route.on("addrIn", transport.openAddr, transport);

                tlke.on("packet", route.processPacket, route);
                tlke.on("addr", route.setAddr, route);
                tlke.on("keyReady", this.on_keyReady, this);
                tlke.on("offer", this.on_requestOffer, this);
                tlke.on("auth", this.on_requestAuth, this);

                transport.on("networkPacket", route.processNetworkPacket, route);
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
            on_keyReady: function (args) {
                this._log("on_keyReady", args);
                this.fire("done", args);
            },
            _log: function () {
                //console.log(this.name, arguments);
            }
        });

        function TlhtBuilder(name, transport) {
            this.name = "TlhtBuilder::" + name;
            this._defineEvent("done");
            this.transport = transport;
        }
        TlhtBuilder.prototype = new EventEmitter();
        $.extend(TlhtBuilder.prototype, {
            build: function (args) {
                var tlht = this.tlht = new Tlht();
                var route = this.route = new Route();
                var transport = this.transport;

                route.on("packet", tlht.processPacket, tlht);
                route.on("networkPacket", transport.sendNetworkPacket, transport);
                route.on("addrIn", transport.openAddr, transport);

                tlht.on("packet", route.processPacket, route);

                transport.on("networkPacket", route.processNetworkPacket, route);
                tlht.on("htReady", this.on_htReady, this);

                tlht.setRng(random);
                tlht.init(args.key);
                route.setAddr(args);
                tlht.generate();
            },
            on_htReady: function (args) {
                this._log("on_htReady", args);
                this.hashStart = args.hashStart;
                this.hashEnd = args.hashEnd;
                this._log("hashStart", args.hashStart.as(Hex));
                this._log("hashEnd", args.hashEnd.as(Hex));
            },
            _log: function () {
                //console.log(this.name, arguments);
            }
        });

        describe("with transport", function () {
            beforeEach(function () {
                var transport = this.transport = new Transport();
                var aliceTlke = this.aliceTlke = new TlkeBuilder("Alice", transport);
                var bobTlke = this.bobTlke = new TlkeBuilder("Bob", transport);
                var aliceTlth = this.aliceTlth = new TlhtBuilder("Alice", transport);
                var bobTlht = this.bobTlht = new TlhtBuilder("Bob", transport);

                aliceTlke.on("offer", bobTlke.enterOffer, bobTlke);
                aliceTlke.on("auth", bobTlke.enterAuth, bobTlke);

                aliceTlke.on("done", aliceTlth.build, aliceTlth);
                bobTlke.on("done", bobTlht.build, bobTlht);

                aliceTlke.build();
                bobTlke.build();
                aliceTlke.generate();
            });

            it("alice hash tails are ready", function () {
                expect(this.aliceTlth.hashStart).not.toBeUndefined();
                expect(this.aliceTlth.hashEnd).not.toBeUndefined();
            });

            it("bob hash tails are ready", function () {
                expect(this.bobTlht.hashStart).not.toBeUndefined();
                expect(this.bobTlht.hashEnd).not.toBeUndefined();
            });

        });

    });

});
