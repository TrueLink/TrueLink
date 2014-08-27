    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import eventEmitter = require("modules/events/eventEmitter");
    import serializable = require("modules/serialization/serializable");
    import model = require("mixins/model");

    import PageModel = require("./PageModel");
    import Dialog = require("models/Dialog");

    function DialogPageModel() {
        this.accepts = Dialog;
        this._defineEvent("changed");
    }

    DialogPageModel.prototype = new PageModel();

    extend(DialogPageModel.prototype, eventEmitter, serializable, model, {
        constructor: DialogPageModel,
        serialize: function (packet, context) {
            //mode. mode="addPeople" is for displaying contact list with checkboxes
            packet.setData({
                mode: this.mode
            });
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this.mode = data.mode;
            this._deserializeModel(packet, context);
        }

    });

    export = DialogPageModel;
