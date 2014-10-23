    "use strict";
    module.exports = {
        looksLikeSerializable: function (obj) {
            return obj &&
                (typeof obj.deserialize === "function") &&
                (typeof obj.serialize === "function") &&
                (typeof obj.exportMeta === "function") &&
                (typeof obj.importMeta === "function") &&
                (typeof obj.getMeta === "function")// &&
                //(typeof obj.serializationNeeded === "function");
        },
        //serialize: function (packet, context) {
        //    throw new Error("Not implemented");
        //},
        //deserialize: function (packet, context) {
        //    throw new Error("Not implemented");
        //},
        //serializationNeeded: function () {
        //    throw new Error("Not implemented");
        //},
        getMeta: function () {
            return this.meta;
        },
        exportMeta: function (packet, context) {
            // todo temp
            this.meta = this.meta || {};
            this.meta.type = this.constructor.name;
            packet.setMetaData(this.meta);
        },
        importMeta: function (packet, context) {
            this.meta = packet.getMetaData();
        }
    };
