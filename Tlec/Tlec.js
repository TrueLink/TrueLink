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

    this._defineEvent("messageToSend");
    this._defineEvent("messageToProcess");
    this._defineEvent("changed");
    this._factory = factory;
}

extend(Tlec.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {
        var data = {};
        packet.setData(data);
    },

    deserialize: function (packet, context) {
        var data = packet.getData();
    },

    init: function (args) {
        this.checkEventHandlers();
        this._onChanged();
    },

    sendMessage: function (message) {
        this.fire("messageToSend", {
            "t": "u",
            "d": message.as(Hex).serialize()
        });
    },
    
    processMessage: function (args) {
        console.log("tlec.processMessage", args);
        
        var message = args.data;
        if (message.t === "u" && message.d) {
            this.fire("messageToProcess", {
                isEcho: args.isEcho,
                data: Hex.deserialize(message.d)
            });
        }        
    },

    _onChanged: function () {
        this.fire("changed", this);
    },


});

module.exports = Tlec;
