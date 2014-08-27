    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");

    function PageModel() {  }

    extend(PageModel.prototype, {
        setModel: function (model) {
            invariant(this.accepts, "this.modelConstructor must be set to a valid model constructor");
            invariant(model instanceof this.accepts, "model is not instanceof %s", this.accepts);
            if (this.model) {
                this.model.off("changed", this._onChanged, this);
            }
            model.on("changed", this._onChanged, this);
            this.model = model;
        },
        _deserializeModel: function (packet, context) {
            var factory = this._factory;
            this.setModel(context.deserialize(packet.getLink("model")));
        },
        _serializeModel: function (packet, context) {
            packet.setLink("model", context.getPacket(this.model));
        }
    });

    export = PageModel;
