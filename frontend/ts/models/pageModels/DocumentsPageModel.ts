    "use strict";
    import modules = require("modules");
    var invariant = modules.invariant;
    import extend = require("../../tools/extend");
    var eventEmitter = modules.events.eventEmitter;
    var serializable = modules.serialization.serializable;
    import model = require("../../mixins/model");

    import PageModel = require("./PageModel");
    import Profile = require("../../models/Profile");

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
