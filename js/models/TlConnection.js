define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");


    function TlConnection(factory, contact) {
        invariant(factory, "Can be constructed only with factory");
        invariant(contact, "Can i haz contact?");
        this.factory = factory;
        this.contact = contact;
        this._defineEvent("changed");

        this.status = null;
    }

    extend(TlConnection.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {

        },
        deserialize: function (packet, context) {
            var factory = this.factory;
            var data = packet.getData();
        },
        init: function () {
            this.status = TlConnection.STATUS_NOT_STARTED;
        }

    });


    TlConnection.STATUS_NOT_STARTED = 0;
    TlConnection.STATUS_ESTABLISHED = 10;


    module.exports = TlConnection;
});