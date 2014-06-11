define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var PageModel = require("./PageModel");
    var Profile = require("models/Profile");

    function DocumentsPageModel(factory) {
        invariant(factory, "Can be constructed only with factory");
        this._factory = factory;
        this.accepts = Profile;
        this._defineEvent("changed");
    }

    DocumentsPageModel.prototype = new PageModel();

    extend(DocumentsPageModel.prototype, eventEmitter, serializable, model, {
        constructor: DocumentsPageModel,
        serialize: function (packet, context) {
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var factory = this._factory;
            var data = packet.getData();
            this._deserializeModel(packet, context);
        }

    });

    module.exports = DocumentsPageModel;
});