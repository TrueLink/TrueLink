define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var PageModel = require("./PageModel");
    var Contact = require("models/Contact");

    function ContactPageModel() {
        this.accepts = Contact;
        this._defineEvent("changed");
    }

    ContactPageModel.prototype = new PageModel();

    extend(ContactPageModel.prototype, eventEmitter, serializable, model, {
        constructor: ContactPageModel,
        serialize: function (packet, context) {
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this._deserializeModel(packet, context);
        }

    });

    module.exports = ContactPageModel;
});