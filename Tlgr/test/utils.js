"use strict";
var tools = require("modules/tools");
var extend = tools.extend;

var Tlgr = require("../Tlgr");
var Random = require("modules/cryptography/random");

function TlConnectionFactory() {
    this._transport = null;
}

extend(TlConnectionFactory.prototype, {
    createTlgr: function() {
        return new Tlgr(this);
    },

    createRandom: function() {
        return new Random();
    },
});

module.exports = {
    factory: new TlConnectionFactory()
}