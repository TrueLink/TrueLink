define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");

    module.exports = {
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
});