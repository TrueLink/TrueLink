"use strict";

var tools = require("modules/tools");
var Hex = require("Multivalue/multivalue/hex");
var Utf8String = require("Multivalue/multivalue/utf8string");

var eventEmitter = require("modules/events/eventEmitter");
var invariant = require("invariant");
var Multivalue = require("Multivalue").multivalue.Multivalue;

var serializable = require("modules/serialization/serializable");

var TlhtAlgo = require("./tlht-algo");
var DecryptionFailedError = require('./decryption-failed-error');

var extend = tools.extend;
var isFunction = tools.isFunction;

function Tlht(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

    this._factory = factory;
    this._defineEvent("changed");
    this._defineEvent("packet");
    this._defineEvent("htReady");
    this._defineEvent("expired");
    this._defineEvent("generatedHashtail");
    this._defineEvent("fulfilledHashCheckRequest");
    this._defineEvent("fulfilledHashRequest");
    this._defineEvent("wrongSignatureMessage");

    this._readyCalled = false;
    this._algo = new TlhtAlgo(factory.createRandom());
}

extend(Tlht.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {
        var data = this._algo.serialize();
        data.readyCalled = this._readyCalled;
        packet.setData(data);
    },
    deserialize: function (packet, context) {
        var data = packet.getData();
        this._readyCalled = data.readyCalled;
        this._algo.deserialize(data);
    },

    init: function (key) {
        invariant(key instanceof Multivalue, "key must be multivalue");
        this._algo.init(key);
        this.checkEventHandlers();
        this._onChanged();
    },

    sync: function (key) {
        invariant(key instanceof Multivalue, "key must be multivalue");
        this._algo.sync(key);
        this.checkEventHandlers();
        this._onChanged();
    },

    isReadyCalled: function () {
        return this._readyCalled;
    },


    generate: function () {
        console.log("Tlht generate");
        var hash = this._algo.generate();
        var messageData = {
            "t": "h",
            "d": hash.hashEnd.as(Hex).serialize()
        };
        this._onMessage(messageData);
        this._algo.pushMyHashInfo(hash.hashInfo);
        if (this._algo.isHashReady()) {
            console.log("hashes ready");
            this._onHashReady();
        }
        this.fire("generatedHashtail", hash.hashInfo);
        this._onChanged();
        this._supplyHashtails();
    },

    takeHashtail: function () {
        if (this._algo.isExpired()) {
            return null;
        }
        console.log("Tlht giving hashtail");
        var takenHashtail = this._algo.takeHashtail();
        this._supplyHashtails();
        return takeHashtail;
    },

    fulfillHashRequest: function (message) {
        var hashedMessage = this._algo.hashMessage(message);
        if (this._algo.isExpired()) { 
            this.fire("expired");
        }
        this.fire("fulfilledHashRequest", hashedMessage);
        this._supplyHashtails();
    },

    _supplyHashtails: function () {
        while (!this._algo.areEnoughHashtailsAvailable()) {
            this.generate();
        }            
    },

    fulfillHashCheckRequest: function (netData) {
        this.fire("fulfilledHashCheckRequest", this._algo.processPacket(netData));
    },

    _onMessage: function (messageData) {
        var raw = new Utf8String(JSON.stringify(messageData));
        var encrypted = this._algo.createMessage(raw);
        this.fire("packet", encrypted);
    },

    // process packet from the network
    processPacket: function (bytes) {
        invariant(bytes instanceof Multivalue, "bytes must be multivalue");

        var netData;
        try {
            netData = this._algo.processMessage(bytes);
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                console.warn("Tlht failed to decrypt message. " + ex.innerError.message);
                return; // not for me
            } else {
                throw ex;
            }
        }

        if (netData === null) {
            this.fire("wrongSignatureMessage", netData);
            return;
        }

        var message;
        try {
            message = JSON.parse(netData.as(Utf8String).value);
        } catch (ex) {
            console.log("Tlht failed to parse message");
            // not for me
            return;
        }

        if (message.t === "h" && message.d) {
            this._algo.setHashEnd(Hex.deserialize(message.d));
            if (this._algo.isHashReady()) {
                console.log("hashes ready");
                this._onHashReady();
            }
            this._onChanged();
        } else {
            console.log("Tlht process packet, skiping some msg", message);
        }
    },

    _onHashReady: function () {
        if (this._readyCalled) { return; }
        this._readyCalled = true;
        this.fire("htReady");
    },

    _onChanged: function () {
        this.fire("changed", this);
    }


});

module.exports = Tlht;