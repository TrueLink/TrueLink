define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var PageModel = require("./PageModel");
    var Profile = require("models/Profile");

    function DialogsPageModel() {
        this.accepts = Profile;
        this._defineEvent("changed");
    }

    DialogsPageModel.prototype = new PageModel();

    extend(DialogsPageModel.prototype, eventEmitter, serializable, model, {
        constructor: DialogsPageModel,
        serialize: function (packet, context) {
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this._deserializeModel(packet, context);
        }

    });

    module.exports = DialogsPageModel;
});