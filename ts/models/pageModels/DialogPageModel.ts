    "use strict";
    var invariant = require("modules/invariant");
    import extend = require("tools/extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var PageModel = require("./PageModel");
    var Dialog = require("models/Dialog");

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
