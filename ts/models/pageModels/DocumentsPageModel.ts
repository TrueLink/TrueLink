    "use strict";
    import invariant = require("../../modules/invariant");
    import extend = require("tools/extend");
    import eventEmitter = require("../../modules/events/eventEmitter");
    import serializable = require("../../modules/serialization/serializable");
    import model = require("mixins/model");

    import PageModel = require("./PageModel");
    import Profile = require("models/Profile");

    function DocumentsPageModel() {
        this.accepts = Profile.Profile;
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
