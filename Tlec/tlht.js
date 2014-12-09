"use strict";

var tools = require("modules/tools");
var Hex = require("Multivalue/multivalue/hex");
var Utf8String = require("Multivalue/multivalue/utf8string");

var eventEmitter = require("modules/events/eventEmitter");
var invariant = require("invariant");
var Multivalue = require("Multivalue").multivalue.Multivalue;

var serializable = require("modules/serialization/serializable");

var TlhtAlgo = require("./tlht-algo");

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

    // is used to determine if we are hashing another hashtail or user-message
    // in order to avoid calling this.generate() while already being in generation process
    // (should not be serialized?)
    this._unsentHashtailsCount = 0;
}

extend(Tlht.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {
        var data = this._algo.serialize();
        data.readyCalled = this._readyCalled;
        data.unhandledPacketsData = this._unhandledPacketsData.map(function (packetData) {
            return {
                isEcho: packetData.isEcho,
                data: packetData.data.as(Hex).serialize()
            };
        });
        packet.setData(data);
    },
    deserialize: function (packet, context) {
        var data = packet.getData();
        this._readyCalled = data.readyCalled;
        this._unhandledPacketsData = !data.unhandledPacketsData ? [] :
            data.unhandledPacketsData.map(function (packetData) {
                return {
                    isEcho: packetData.isEcho,
                    data: Hex.deserialize(packetData.data)
                };
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
    unhash: function (args) {
        if (args) { 
            invariant(args.data instanceof Multivalue, "args.data must be multivalue");
            this._unhandledPacketsData.unshift(args);
        } // if called without args -- then just recheck current packets

        if (!this._readyCalled && this._algo.unhashedFirst(args.isEcho)) {
            return; // do not start firing packets to early
        }

        // try to handle packets one per cycle while handling succeeds
        var readyCalled = this._readyCalled;
        var handled;
        do {
            handled = false;
            var i = 0;
            for ( ; i < this._unhandledPacketsData.length; i++) {
                var data = this._unhandledPacketsData[i];
                handled = this._doUnhash(data.data, data.isEcho);
                if (handled) {
                    break;
                }
            }
            if (handled) {
                this._unhandledPacketsData.splice(i, 1); 
                this._onChanged();             
            }
        } while (handled && readyCalled);                
    },

    _doUnhash: function (bytes, isEcho) {
        var data = this._algo.processPacket(bytes, isEcho);

        if (data === null) {
            return false;
        }

        var message;
        try {
            message = JSON.parse(data.as(Utf8String).value);
        } catch (ex) {
            console.log("Tlec failed to parse message", ex, data);
            // not for me
            return true;
        }

        this.fire("unhashed", {
            isEcho: isEcho,
            data: message
        });        

        return true;
    },

    // takes object (not Multivalue!), and fires stringified and hashed
    hash: function (object) {
        this._supplyHashtails();
        var raw = new Utf8String(JSON.stringify(object));
        var hashed = this._algo.hashMessage(raw);
        this._onChanged();
        if (this._algo.areAnyHashesAvailable()) { 
            this.fire("expired");
        }
        this.fire("hashed", hashed);
    },


    _sendMessage: function (message) {
        this._unsentHashtailsCount++;
        this.fire("messageToSend", {
            "t": "h",
            "d": message.as(Hex).serialize()
        });
        this._unsentHashtailsCount--;        
    },
    
    processMessage: function (args) {
        var message = args.data;
        if (message.t === "h" && message.d) {
            this._algo.setHashEnd(Hex.deserialize(message.d), args.isEcho);
            this._onHashMayBeReady();
            this._onChanged();
        }
    },



    generate: function () {
        console.log("Tlht generate");
        var hashEnd = this._algo.generate();


        // order matters for this two!
        // if we first push then send, we may sign it with itself
        // (auto references everywhere, yeah...)
        this._sendMessage(hashEnd);
        this._algo.activateHashEnd(hashEnd);


        this._onHashMayBeReady();
        this._onChanged();
    },

    addCowriter: function (cowriter) {
        this._algo.addCowriter(cowriter);
        if (this._algo.areAnyHashesAvailable()) {
            return;
        }
        if (this._algo.getCowriterActiveHashes(cowriter).length > 0) {
            return;
        }
        console.log("Tlht giving hashtail");
        this._supplyHashtails();
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
        //avoid calling this.generate() while already being in generation process
        if (this._unsentHashtailsCount !== 0) { return; }        

        while (!this._algo.areEnoughHashtailsAvailable()) {
            this.generate();
        }            
    },






    _onHashMayBeReady: function () {
        if (this._readyCalled || !this._algo.isHashReady()) { return; }
        console.log("hashes ready");
        this._readyCalled = true;
        this.fire("htReady");
        this.unhash();
    },

    _onChanged: function () {
        this.fire("changed", this);
    }


});

module.exports = Tlht;