define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var PageModel = require("./PageModel");
    var Profile = require("models/Profile");
    var Contact = require("models/Contact");

    function ContactPageModel(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this.accepts = Profile;
        this._defineEvent("changed");
    }

    ContactPageModel.prototype = new PageModel();

    extend(ContactPageModel.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var factory = this.factory;
            var data = packet.getData();
            this._deserializeModel(packet, context, factory.createProfile.bind(factory));
        }

    });

    module.exports = ContactPageModel;
});