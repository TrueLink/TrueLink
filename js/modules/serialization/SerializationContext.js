define(["modules/dictionary", "tools/invariant", "./SerializationPacket", "zepto"], function (Dictionary, invariant, SerializationPacket, $) {
    "use strict";
    function SerializationContext() {
        // packet => obj
        this._objregistry = new Dictionary();
        this.saveCb = function () {};
        this.timeout = null;
    }

    SerializationContext.prototype = {
        _getObject: function (packet) {
            return this._objregistry.item(packet);
        },
        _setObject: function (packet, obj) {
            this._objregistry.item(packet, obj);
        },
        _getPacket: function (obj) {
            var found = this._objregistry.first(function (item) { return item.value === obj; });
            return found ? found.key : undefined;
        },
        _setPacket: function (obj, packet) {
            this._setObject(packet, obj);
        },

        getPackets: function () {
            return this._objregistry.keys();
        },
        serialize: function (obj) {
            invariant(obj && $.isFunction(obj.serialize), "obj must be serializable");
            var packet = this._getPacket(obj);
            if (!packet) {
                packet = new SerializationPacket();
                this._setPacket(obj, packet);
                obj.serialize(packet, this);
            }
            if (!this.timeout) {
                this.timeout = setTimeout(this._serializeAll.bind(this), 4);
            }
            return packet;
        },

        _resolveLinks: function (objRegItem) {
            var packet = objRegItem.key, linkName;
            var linkedObjects = packet.getLinkedObjs();
            for (linkName in linkedObjects) {
                if (linkedObjects.hasOwnProperty(linkName)) {
                    packet.setLinkedPacket(linkName, this._getPacket(linkedObjects[linkName]));
                }
            }
        },

        _serializeAll: function () {
            this._objregistry.items().forEach(this._resolveLinks.bind(this));
            this.saveCb(this._objregistry.keys());
        },


        deserialize: function (packet, constructor) {

        }


    };

    return SerializationContext;
});