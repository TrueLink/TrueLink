define([
    "modules/channels/EventEmitter",
    "modules/channels/tlke", 
    "modules/channels/tlht", 
    "tools/random", 
    "modules/data-types/Hex", 
    "modules/channels/Route",
    "zepto"
], function (EventEmitter, Tlke, Tlht, random, Hex, Route, $) {

    describe("Tlke", function() {

        function Builder(name) {
            this.name = name;
            this._defineEvent("networkPacket");
            this._defineEvent("offer");
            this._defineEvent("auth");
            var tlke = this.tlke = new Tlke();
            var route = this.route = new Route();
            tlke.setRng(random);
            route.on("packet", tlke.processPacket, tlke);
            tlke.on("packet", route.processPacket, route);
            tlke.on("addr", route.setAddr, route);
            route.on("networkPacket", this.on_sendPacket, this);
            tlke.on("keyReady", this.keyReady, this);

            tlke.on("offer", this.on_requestOffer, this);
            tlke.on("auth", this.on_requestAuth, this);

        }
        Builder.prototype = new EventEmitter();
        $.extend(Builder.prototype, {
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
            _log: function() {
                //console.log(this.name, arguments);
            }
        });

        beforeEach(function() {
            this.alice = new Builder("Alice");
            this.bob = new Builder("Bob");
            this.alice.on("networkPacket", this.bob.processNetworkPacket, this.bob);
            this.bob.on("networkPacket", this.alice.processNetworkPacket, this.alice);

            this.alice.on("offer", this.bob.enterOffer, this.bob);
            this.alice.on("auth", this.bob.enterAuth, this.bob);
        });

        it("tlke with route", function() {
            this.alice.generate();

            this.alice.inId.as(Hex).isEqualTo(this.bob.outId.as(Hex));
            this.alice.outId.as(Hex).isEqualTo(this.bob.inId.as(Hex));
            this.alice.key.as(Hex).isEqualTo(this.bob.key.as(Hex));
        });
    });

});
