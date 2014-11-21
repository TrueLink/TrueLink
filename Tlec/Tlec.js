"use strict";
var tools = require("modules/tools");

var eventEmitter = require("modules/events/eventEmitter");
var invariant = require("invariant");

var serializable = require("modules/serialization/serializable");

var TlecAlgo = require("./tlec-algo");
var DecryptionFailedError = require('./decryption-failed-error');

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
    this._algo = new TlecAlgo(factory.createRandom());
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
        this._algo.init(initObj);
        this.checkEventHandlers();
        this._onChanged();
    },

    sendMessage: function (message) {
        this.fire("requestedHash", message);
    },

    sendHashedMessage: function(hashedMessage) {
        var encrypted = this._algo.createMessage(hashedMessage);
        this._onChanged();
        this.fire("packet", encrypted);        
    },

    processPacket: function (bytes) {
        var netData;
        try {
            netData = this._algo.processPacket(bytes);
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                throw DecryptionFailedError.innerError;
            } else {
                throw ex;
            }
        }

        this.fire("requestedHashCheck", netData);      
    },

    processCheckedPacket: function (checkedNetData) {
        if (checkedNetData == null) {
            this.fire("wrongSignatureMessage", checkedNetData);
            return;
        }
        this.fire("message", checkedNetData);
    },

    _onChanged: function () {
        this.fire("changed", this);
    },


});

module.exports = Tlec;
