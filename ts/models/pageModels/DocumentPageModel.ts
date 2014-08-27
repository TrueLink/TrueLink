    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import eventEmitter = require("modules/events/eventEmitter");
    import serializable = require("modules/serialization/serializable");
    import model = require("mixins/model");

    import PageModel = require("./PageModel");
    import Document = require("models/Document");

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
