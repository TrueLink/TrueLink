define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");


    function CouchPolling(factory, profileId) {
        invariant(factory, "Can be constructed only with factory");
        invariant(factory, "Can i haz profileId");
        this.factory = factory;
        this.profileId = profileId;
        this._defineEvent("changed");

        this.profileId = null;

    }

    extend(CouchPolling.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {

        },
        deserialize: function (packet, context) {
            var factory = this.factory;
            var data = packet.getData();
        }

    });

    module.exports = CouchPolling;
});