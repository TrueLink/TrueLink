define(["modules/dictionary", "tools/invariant", "./SerializationPacket", "zepto", "modules/channels/EventEmitter"
], function (Dictionary, invariant, SerializationPacket, $, EventEmitter) {
    "use strict";
    function SerializationContext() {
        // packet => obj
        this._objregistry = new Dictionary();
        this.timeout = null;
        this._defineEvent("serialized");
    }

    SerializationContext.prototype = new EventEmitter();

    $.extend(SerializationContext.prototype, {
        getObject: function (packet) {
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

        _getOrCreatePacket: function (obj) {
            invariant(obj && $.isFunction(obj.serialize), "obj must be serializable");
            var packet = this._getPacket(obj);
            if (!packet) {
                packet = new SerializationPacket();
                this._setPacket(obj, packet);
            }
            return packet;
        },

        serializeLink: function (obj) {
            if (obj === null || obj === undefined) {
                return SerializationPacket.nullPacket;
            }
            var _this = this;
            if ($.isArray(obj)) {
                return obj.map(function (o) {
                    return _this._getOrCreatePacket(o);
                });
            }
            return this._getOrCreatePacket(obj);
        },

        serialize: function (obj) {
            if (obj === null || obj === undefined) {
                return SerializationPacket.nullPacket;
            }
            if ($.isArray(obj)) {
                return obj.map(this.serialize.bind(this));
            }

            var packet = this._getOrCreatePacket(obj);
            if (!packet.isSerialized) {
                packet.isSerialized = true;
                obj.serialize(packet, this);
            }
            if (!this.timeout) {
                this.timeout = setTimeout(this._serializeAll.bind(this), 4);
            }
            return packet;
        },

        _serializeAll: function () {
            this.fire("serialized", this._objregistry.keys().filter(function (packet) {
                return packet.isSerialized;
            }));
            this._objregistry = null;
        },


        deserialize: function (packet, constructor) {
            if ($.isArray(packet)) {
                return packet.map((function (p) {
                    return this.deserialize(p, constructor);
                }).bind(this));
            }
            return this._getOrCreateObject(packet, constructor);
        },

        _getOrCreateObject: function (packet, constructor) {
            invariant(packet instanceof SerializationPacket, "packet must be SerializationPacket");
            if (packet === SerializationPacket.nullPacket) { return null; }
            var object = this.getObject(packet);
            if (!object) {
                object = new constructor();
                this._setObject(packet, object);
                invariant(packet.id, "packet should have an id");
                object.id = packet.id;
                if (!packet.isDeserialized) {
                    packet.isDeserialized = true;
                    object.deserialize(packet, this);
                }
            }
            return object;
        }


    });

    return SerializationContext;
});