    "use strict";
    import modules = require("modules");
    import invariant = require("invariant");
    import extend = require("../../tools/extend");
    import Event = require("../../tools/event");
    import Model = require("../../tools/model");
    var serializable = modules.serialization.serializable;
    import Hex = require("Multivalue/multivalue/hex");
    import TlecBuilder = require("TlecBuilder");
    import CouchTransport = require("../../models/tlConnection/CouchTransport");
    import Utf8String = require("Multivalue/multivalue/utf8string");

    export class TlConnection extends Model.Model implements ISerializable {

        public onMessage : Event.Event<IUserMessage>;
        public onDone : Event.Event<TlConnection>;
        public offer : any;
        public auth : any;

        private _initialTlec : any;
        private _tlecs : Array<any>;
        private _addrIns : Array<any>;

        constructor () {
            super();

            this.onMessage = new Event.Event<IUserMessage>("TlConnection.onMessage");
            this.onDone = new Event.Event<TlConnection>("TlConnection.onDone");
            this.offer = null;
            this.auth = null;
            this._initialTlec = null;
            this._tlecs = [];
            this._addrIns = [];
        }

        init  () {
            this._initialTlec = this.getFactory().createCouchTlec();
            this._linkInitial();
            this._initialTlec.init();
            this._onChanged();
        }

        run  () {
            if (this._initialTlec) {
                this._initialTlec.run();
            }
            this._tlecs.forEach(function (tlec) { tlec.run(); });
        }

        getStatus  () {
            if (this.canSendMessages()) {
                return TlecBuilder.STATUS_ESTABLISHED;
            }
            return this._initialTlec ? this._initialTlec.getStatus() : null;
        }
        
        generateOffer  () {
            this._initialTlec.generateOffer();
        }

        enterOffer  (offer) {
            this._initialTlec.enterOffer(offer);
        }

        enterAuth  (auth) {
            this._initialTlec.enterAuth(auth);
        }

        abortTlke  () {
            this.offer = null;
            this.auth = null;
            if (this._initialTlec) {
                this._initialTlec.destroy();
            }
            this._tlecs.forEach(function (builder) { builder.destroy(); });
            this._tlecs = [];
            this.init();
        }

        serialize  (packet, context) {

            packet.setData({
                offer: this.offer ? this.offer.as(Hex).serialize() : null,
                auth: this.auth ? this.auth.as(Hex).serialize() : null,
                addrIns: this._addrIns.map(function (addr) { return addr.as(Hex).serialize(); })
            });

            packet.setLink("_initialTlec", context.getPacket(this._initialTlec));
            packet.setLink("_tlecs", context.getPacket(this._tlecs));
        }

        deserialize  (packet, context) {
            this.checkFactory();
            var factory = this.getFactory();
            var data = packet.getData();

            this.offer = data.offer ? Hex.deserialize(data.offer) : null;
            this.auth = data.auth ? Hex.deserialize(data.auth) : null;
            this._addrIns = data.addrIns ? data.addrIns.map(function (addr) { return Hex.deserialize(addr); }) : [];

            this._initialTlec = context.deserialize(packet.getLink("_initialTlec"), factory.createCouchTlec, factory);
            this._linkInitial();
            this._tlecs = context.deserialize(packet.getLink("_tlecs"), factory.createCouchTlec, factory);
            this._tlecs.forEach(this._linkFinishedTlec, this);
        }

        _linkFinishedTlec  (tlecWrapper) {
            tlecWrapper.on("message", this._receiveMessage, this);
        }

        _addTlec  (tlecWrapper) {
            this._linkFinishedTlec(tlecWrapper);
            this._tlecs.push(tlecWrapper);
        }

        canSendMessages  () {
            return this._tlecs.length > 0;
        }

        sendMessage  (msg : IUserMessage) {
            if (!this.canSendMessages()) { throw new Error("no tlec"); }
            var data = Utf8String.fromString(JSON.stringify(msg));
            var activeTlec = this._tlecs[0];
            activeTlec.sendMessage(data);
        }

        _receiveMessage  (messageData) {
            if (messageData.metadata) {
                delete messageData.metadata;
            }
            var result = JSON.parse(messageData.as(Utf8String).toString());
            result.metadata = result.metadata || {};
            result.metadata.tlConnection = this;
            this.onMessage.emit(result);
        }

        _linkInitial  () {
            var builder = this._initialTlec;
            if (!builder) { return; }
            builder.on("changed", this._onChanged, this);
            builder.on("offer", this._onInitialOffer, this);
            builder.on("auth", this._onInitialAuth, this);
            builder.on("done", this._onInitialTlecBuilderDone, this);
        }

        _onInitialTlecBuilderDone  (builder) {
            this._initialTlec = null;
            this._addTlec(builder);
            this.onDone.emit(this);
            this._onChanged();
        }

        _onInitialOffer  (offer) {
            this.offer = offer;
            this._onChanged();
        }

        _onInitialAuth  (auth) {
            if (auth) {
                this.auth = auth;
                this._onChanged();
            }
        }
    };
extend(TlConnection.prototype, serializable);

