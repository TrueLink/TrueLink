    "use strict";
    var invariant = require("modules/invariant");
    import extend = require("tools/extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var PageModel = require("./PageModel");
    var Profile = require("models/Profile");

    function DocumentsPageModel() {
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
            var data = packet.getData();
            this._deserializeModel(packet, context);
        }

    });

    export = DocumentsPageModel;
