    "use strict";
    var invariant = require("modules/invariant");
    import extend = require("tools/extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var PageModel = require("./PageModel");
    var Document = require("models/Document");

    function DocumentPageModel() {
        this.accepts = Document;
        this._defineEvent("changed");
    }

    DocumentPageModel.prototype = new PageModel();

    extend(DocumentPageModel.prototype, eventEmitter, serializable, model, {
        constructor: DocumentPageModel,
        serialize: function (packet, context) {
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this._deserializeModel(packet, context);
        }

    });

    export = DocumentPageModel;
