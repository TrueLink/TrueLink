define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var PageModel = require("./PageModel");
    var Profile = require("models/Profile");

    function ContactsPageModel() {
        this.accepts = Profile;
        this._defineEvent("changed");
    }

    ContactsPageModel.prototype = new PageModel();

    extend(ContactsPageModel.prototype, eventEmitter, serializable, model, {
        constructor: ContactsPageModel,
        serialize: function (packet, context) {
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this._deserializeModel(packet, context);
        }

    });

    module.exports = ContactsPageModel;
});