"use strict";

var tools = require("../modules/tools");
var Hex = require("../Multivalue/multivalue/hex");
var Utf8String = require("../Multivalue/multivalue/utf8string");

var eventEmitter = require("../modules/events/eventEmitter");
var invariant = require("../modules/invariant");
var Multivalue = require("../Multivalue").Multivalue;

var serializable = require("../modules/serialization/serializable");

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
        this._readyCalled = dto.readyCalled;
        this._algo.deserialize(data);
    },

    init: function (key) {
        invariant(key instanceof Multivalue, "key must be multivalue");
        this._algo.init(key);
        this.checkEventHandlers();
        this._onChanged();
    },

    generate: function () {
        console.log("Tlht generate");
        var hashEnd = this._algo.generate();
        var messageData = {
            "t": "h",
            "d": hashEnd.as(Hex).serialize()
        };
        this._onMessage(messageData);
        if (this._algo.isHashReady()) {
            console.log("hashes ready");
            this._onHashReady();
        }
        this._onChanged();
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
        } else {
            console.log("Tlht process packet, skiping some msg", message);
        }
    },

    _onHashReady: function () {
        if (this._readyCalled) { return; }
        this._readyCalled = true;
        this.fire("htReady", this._algo.getHashReady());
        this._onChanged();
    },

    _onChanged: function () {
        this.fire("changed", this);
    }


});

module.exports = Tlht;