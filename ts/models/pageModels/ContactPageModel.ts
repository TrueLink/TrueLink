    "use strict";
    import modules = require("modules");
    var invariant = modules.invariant;
    import extend = require("../../tools/extend");
    var eventEmitter = modules.events.eventEmitter;
    var serializable = modules.serialization.serializable;
    import model = require("../../mixins/model");

    import PageModel = require("./PageModel");
    import Contact = require("../../models/Contact");

    function ContactPageModel() {
        this.accepts = Contact.Contact;
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

    export = ContactPageModel;
