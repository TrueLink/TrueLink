"use strict";
var tools = require("modules/tools");

var Hex = require("Multivalue/multivalue/hex");
var Utf8String = require("Multivalue/multivalue/utf8string");


var eventEmitter = require("modules/events/eventEmitter");
var invariant = require("invariant");

var serializable = require("modules/serialization/serializable");

var extend = tools.extend;
var isFunction = tools.isFunction;

function Tlec(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

    this._defineEvent("packet");
    this._defineEvent("message");
    this._defineEvent("wrongSignatureMessage");
    this._defineEvent("changed");
    this._defineEvent("requestedHashCheck");
    this._defineEvent("requestedHash");
    
    this._factory = factory;
}

extend(Tlec.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {
        var data = this._algo.serialize();
        packet.setData(data);
    },
    deserialize: function (packet, context) {
        var data = packet.getData();
        this._algo.deserialize(data);
    },

    init: function (initObj) {
        this.checkEventHandlers();
        this._onChanged();
    },

    sendMessage: function (message) {
        var messageData = {
            "t": "u",
            "d": message.as(Hex).serialize()
        };
        var raw = new Utf8String(JSON.stringify(messageData));        
        this.fire("requestedHash", raw);
    },

    sendHashedMessage: function(hashedMessage) {
        this.fire("packet", hashedMessage);        
    },

    processPacket: function (bytes) {
        this.fire("requestedHashCheck", bytes);      
    },

    processCheckedPacket: function (checkedNetData) {
        if (checkedNetData == null) {
            this.fire("wrongSignatureMessage", checkedNetData);
            return;
        }

        var message;
        try {
            message = JSON.parse(checkedNetData.as(Utf8String).value);
        } catch (ex) {
            console.log("Tlec failed to parse message");
            // not for me
            return;
        }

        if (message.t === "u" && message.d) {
            this.fire("message", Hex.deserialize(message.d));
        }        
    },

    _onChanged: function () {
        this.fire("changed", this);
    },


});

module.exports = Tlec;
