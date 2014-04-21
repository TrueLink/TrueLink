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

    var logfunc = function() {
        var args = [this.name].concat(arguments);
        //console.log.apply(console, args);
    }

    describe("True Link Hash Tail Exchange", function () {

        function TlkeTestBuilder(name, transport) {
            this.name = "TlkeTestBuilder" + name;
            this._defineEvent("offer");
            this._defineEvent("auth");
            this._defineEvent("done");
            this.transport = transport;
        }
        TlkeTestBuilder.prototype = new EventEmitter();
        $.extend(TlkeTestBuilder.prototype, {
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
            _log: logfunc
        });

        function TlhtTestBuilder(name, transport) {
            this.name = "TlhtTestBuilder::" + name;
            this._defineEvent("done");
            this.transport = transport;
        }
        TlhtTestBuilder.prototype = new EventEmitter();
        $.extend(TlhtTestBuilder.prototype, {
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
            _log: logfunc
        });

        describe("with transport", function () {
            beforeEach(function () {
                var transport = this.transport = new Transport();
                var aliceTlke = this.aliceTlke = new TlkeTestBuilder("Alice", transport);
                var bobTlke = this.bobTlke = new TlkeTestBuilder("Bob", transport);
                var aliceTlth = this.aliceTlth = new TlhtTestBuilder("Alice", transport);
                var bobTlht = this.bobTlht = new TlhtTestBuilder("Bob", transport);

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
