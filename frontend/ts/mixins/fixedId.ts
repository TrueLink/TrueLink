    "use strict";
    import modules = require("modules");
    var invariant = modules.invariant;

    var exp = {
        _getMeta: function () {
            invariant(this.fixedId, "object must have fixedId");
            var meta = this.meta || {};
            meta.fixedId = this.fixedId;
            return meta;
        },
        getMeta: function () {
            return this._getMeta();
        },
        exportMeta: function (packet, context) {
            // todo temp
            var meta = this._getMeta();
            meta.type = this.constructor.name;
            packet.setMetaData(meta);
        }
    };
export = exp;
