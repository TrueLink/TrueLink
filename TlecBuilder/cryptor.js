"use strict";

var MultivalueModule = require("Multivalue");
var Multivalue = MultivalueModule.multivalue.Multivalue;
var Hex = MultivalueModule.Hex;
var BitArray = require("Multivalue/multivalue/bitArray");
var Bytes = require("Multivalue/multivalue/bytes");

var SHA1 = require("modules/cryptography/sha1-crypto-js");
var Aes = require("modules/cryptography/aes-sjcl");

var eventEmitter = require("modules/events/eventEmitter");
var invariant = require("invariant");

var serializable = require("modules/serialization/serializable");

var tools = require("modules/tools");
var extend = tools.extend;
var isFunction = tools.isFunction;



function Cryptor(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

    this._defineEvent("encrypted");
    this._defineEvent("decrypted");

    this._defineEvent("changed");
    
    this._factory = factory;
    this._random = factory.createRandom();
    this._dhAesKey = null;
}

extend(Cryptor.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {
        var data = {
            dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null
        };
        packet.setData(data);
    },
    deserialize: function (packet, context) {
        var data = packet.getData();
        this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
    },

    init: function (args) {
        var message = "initObj mus be {key: multivalue}";
        invariant(args, message);
        invariant(args.key instanceof Multivalue, message);
        
        this._dhAesKey = args.key;
        this.checkEventHandlers();
        this._onChanged();
    },

    encrypt: function (bytes) {
        var encrypted = this._encrypt(bytes);      
        this.fire("encrypted", encrypted);
    },

    decrypt: function (bytes) {
        var decrypted = this._decrypt(bytes);  
        if (decrypted) {
            this.fire("decrypted", decrypted);
        }
    },

    destroy: function () {
        this._dhAesKey = null;
    },

    _onChanged: function () {
        this.fire("changed", this);
    },

    _encrypt: function (bytes, customKey) {
        invariant(this._dhAesKey, "channel is not configured");

        var iv = this._getRandomBytes(128);
        var aes = new Aes(customKey || this._dhAesKey);
        var encryptedData = aes.encryptCbc(bytes, iv);
        return iv.as(Bytes).concat(encryptedData);
    },

    _decrypt: function (bytes, customKey) {
        invariant(this._dhAesKey, "channel is not configured");

        var dataBitArray = bytes.as(BitArray);
        var iv = dataBitArray.bitSlice(0, 128);
        var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
        var aes = new Aes(customKey || this._dhAesKey);
        try {
            return aes.decryptCbc(encryptedData, iv);
        }
        catch (ex) {
            return;
        }
    },

    _getRandomBytes: function (bitLength) {
        invariant(isFunction(this._random.bitArray), "random must implement IRandom");
        return this._random.bitArray(bitLength);
    }
});

module.exports = Cryptor;
