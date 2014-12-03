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

    this._defineEvent("hashed");
    this._defineEvent("unhashed");

    this._defineEvent("messageToSend");
    
    this._defineEvent("changed");
    this._defineEvent("htReady");
    this._defineEvent("expired");
    this._defineEvent("hashtail");
    
    this._factory = factory;
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
        packet.setData(data);
    },
    deserialize: function (packet, context) {
        var data = packet.getData();
        this._readyCalled = data.readyCalled;
        this._unhandledPacketsData = !data.unhandledPacketsData ? [] :
            data.unhandledPacketsData.map(function (packetData) {
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



    // takes decrypted, fires unhashed and _parsed_!
    unhash: function (bytes) {
        invariant(bytes instanceof Multivalue, "bytes must be multivalue");
        
        this._unhandledPacketsData.unshift(bytes);
        
        // try to handle packets one per cycle while handling succeeds
        var handled;
        do {
            handled = false;
            var i = 0;
            for ( ; i < this._unhandledPacketsData.length; i++) {
                var data = this._algo.processPacket(this._unhandledPacketsData[i]);
                if (data !== null) {
                    this._doUnhash(data);
                    handled = true;
                    break;
                }
            }
            if (handled) {
                this._unhandledPacketsData.splice(i, 1); 
                this._onChanged();             
            }
        } while (handled);                
    },

    _doUnhash: function (bytes) {
        var message;
        try {
            message = JSON.parse(bytes.as(Utf8String).value);
        } catch (ex) {
            console.log("Tlec failed to parse message", ex, bytes);
            // not for me
            return;
        }

        this.fire("unhashed", message);        
    },

    // takes object (not Multivalue!), and fires stringified and hashed
    hash: function (object) {
        var raw = new Utf8String(JSON.stringify(object));
        var hashed = this._algo.hashMessage(raw);
        this._onChanged();
        if (this._algo.isExpired()) { 
            this.fire("expired");
        }
        this.fire("hashed", hashed);
        this._supplyHashtails();
    },


    _sendMessage: function (message) {
        this.fire("messageToSend", {
            "t": "h",
            "d": message.as(Hex).serialize()
        });
    },
    
    processMessage: function (message) {
        if (message.t === "h" && message.d) {
            this._algo.setHashEnd(Hex.deserialize(message.d));
            this._onHashMayBeReady();
            this._onChanged();
        }    
    },



    generate: function () {
        console.log("Tlht generate");
        var hash = this._algo.generate();
        this._algo.pushMyHashInfo(hash.hashInfo);
        this._sendMessage(hash.hashEnd);
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

    _supplyHashtails: function () {
        while (!this._algo.areEnoughHashtailsAvailable()) {
            this.generate();
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