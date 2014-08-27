    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import eventEmitter = require("modules/events/eventEmitter");
    import serializable = require("modules/serialization/serializable");
    import model = require("mixins/model");

    import PageModel = require("./PageModel");
    import Profile = require("models/Profile");

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

    export = ContactsPageModel;
