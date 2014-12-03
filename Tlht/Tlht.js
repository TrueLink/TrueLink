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
    this._defineEvent("hashtail");
    this._defineEvent("fulfilledHashCheckRequest");
    this._defineEvent("fulfilledHashRequest");
    this._defineEvent("wrongSignatureMessage");

    this._readyCalled = false;
    this._algo = new TlhtAlgo(factory.createRandom());

    this._unhandledPacketsData = [];
    this._unhandledPacketsDataInner = [];
}

extend(Tlht.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {
        var data = this._algo.serialize();
        data.readyCalled = this._readyCalled;
        data.unhandledPacketsData = this._unhandledPacketsData.map(function (packetData) {
            return packetData.as(Hex).serialize();
        });
        data.unhandledPacketsDataInner = this._unhandledPacketsDataInner.map(function (packetData) {
            return packetData.as(Hex).serialize();
        });
        packet.setData(data);
    },
    deserialize: function (packet, context) {
        var data = packet.getData();
        this._readyCalled = data.readyCalled;
        this._unhandledPacketsData = !data.unhandledPacketsData ? [] :
            data.unhandledPacketsData.map(function (packetData) {
                return Hex.deserialize(packetData);
            });
        this._unhandledPacketsDataInner = !data.unhandledPacketsDataInner ? [] :
            data.unhandledPacketsDataInner.map(function (packetData) {
                return Hex.deserialize(packetData);
            });
        this._algo.deserialize(data);
    },

    init: function (args, sync) {
        //TODO 'sync' should not be needed here!
        this._algo.init(args, sync);
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
        this._onHashMayBeReady();
        this.fire("hashtail", hash.hashInfo);
        this._onChanged();
        this._supplyHashtails();
    },

    addCowriter: function (cowriter) {
        this._algo.addCowriter(cowriter);
        if (this._algo.isExpired()) {
            return;
        }
        if (this._algo.getCowriterActiveHashes(cowriter).length > 0) {
            return;
        }
        console.log("Tlht giving hashtail");
        var takenHashtail = this._algo.takeHashtail(cowriter);
        this._supplyHashtails();
        this.fire("hashtail", takenHashtail);
    },

    processHashtail: function (hashInfo) {
        this._algo.processHashtail(hashInfo);
        this._onHashMayBeReady();
        this._onChanged();
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
        this._fulfillHashCheckRequestBoby(this._unhandledPacketsData, netData, function (data) {
            this.fire("fulfilledHashCheckRequest", data);
        }.bind(this));
    },

    _fulfillHashCheckRequestBoby: function (unhandledPacketsData, netData, cb) {
        unhandledPacketsData.unshift(netData);
        
        // try to handle packets one per cycle while handling succeeds
        var handled;
        do {
            handled = false;
            var i = 0;
            for ( ; i < unhandledPacketsData.length; i++) {
                var packetData = unhandledPacketsData[i];
                handled = this._handlePacketData(packetData, cb);
                if (handled) {
                    break;
                }
            }
            if (handled) {
                unhandledPacketsData.splice(i, 1);                
            }
        } while (handled);

        this._onChanged;
    },


    _handlePacketData: function (netData, cb) {
        var data = this._algo.processPacket(netData);
        if (data !== null) {
            cb(data);
            return true;
        }
        return false;     
    },

    _onMessage: function (messageData) {
        var raw = new Utf8String(JSON.stringify(messageData));
        var encrypted = this._algo.createMessage(raw);
        this.fire("packet", encrypted);
    },

    // process packet from the network
    processPacket: function (bytes) {
        invariant(bytes instanceof Multivalue, "bytes must be multivalue");
        this._fulfillHashCheckRequestBoby(this._unhandledPacketsDataInner, bytes, this._processPacketBody.bind(this));
    },

    _processPacketBody: function (netData) {
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
            this._onHashMayBeReady();
            this._onChanged();
        }
    },

    _onHashMayBeReady: function () {
        if (this._readyCalled || !this._algo.isHashReady()) { return; }
        console.log("hashes ready");
        this._readyCalled = true;
        this.fire("htReady");
    },

    _onChanged: function () {
        this.fire("changed", this);
    }


});

module.exports = Tlht;