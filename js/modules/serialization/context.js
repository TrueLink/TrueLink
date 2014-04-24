define(["modules/dictionary", "tools/invariant", "zepto"], function (Dictionary, invariant, $) {
    "use strict";
    function SerializationContext() {
        // packet => obj
        this._objregistry = new Dictionary();
        // id => packet
        this._packetregistry = new Dictionary();
    }

    SerializationContext.prototype = {
        getObject: function (packet) {
            return this._objregistry.item(packet);
        },
        setObject: function (packet, obj) {
            this._objregistry.item(packet, obj);
        },
        getPacket: function (obj) {
            var found = this._objregistry.first(function (item) { return item.value === obj; });
            return found ? found.key : undefined;
        },
        setPacket: function (obj, packet) {
            this.setObject(packet, obj);
        }
    };

    return SerializationContext;
});