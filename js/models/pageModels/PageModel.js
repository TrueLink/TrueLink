define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");

    function PageModel() {  }

    extend(PageModel.prototype, {
        setModel: function (model) {
            invariant(this.accepts, "this.modelConstructor must be set to a valid model constructor");
            invariant(model instanceof this.accepts, "model is not instanceof %s", this.accepts);
            if (this.model) {
                this.model.off("changed", this.onChanged, this);
            }
            model.on("changed", this.onChanged, this);
            this.model = model;
        },
        _deserializeModel: function (packet, context) {
            var factory = this.factory;
            this.setModel(context.deserialize(packet.getLink("model"), factory.shoudBeDeserialized.bind(factory)));
        },
        _serializeModel: function (packet, context) {
            packet.setLink("model", context.getPacket(this.model));
        }
    });

    module.exports = PageModel;
});