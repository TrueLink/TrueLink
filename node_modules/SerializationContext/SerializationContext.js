
    "use strict";
    var Dictionary = require("modules/dictionary/dictionary");
    var invariant = require("modules/invariant");
    var SerializationPacket = require("modules/serialization/SerializationPacket");
    var serializable = require("modules/serialization/serializable");
    var tools = require("modules/tools");
    var extend = tools.extend;
    var isArray = tools.isArray;
    var isFunction = tools.isFunction;


    function SerializationContext() {
        // packet => obj
        this._objregistry = new Dictionary();
    }

    extend(SerializationContext.prototype, {
        getObject: function (packet) {
            return this._objregistry.item(packet);
        },
        getPackets: function () {
            return this._objregistry.keys();
        },

        getObjects: function () {
            return this._objregistry.values();
        },

        getPacket: function (obj) {
            if (obj === null || obj === undefined) {
                return SerializationPacket.nullPacket;
            }
            invariant(typeof obj === "object", "obj must be object");
            if (isArray(obj)) {
                return obj.map(this.getPacket, this);
            }
            var packet = this._getPacket(obj);
            if (!packet) {
                packet = new SerializationPacket();
                this._setPacket(obj, packet);
                obj.exportMeta(packet, this);
            }
            return packet;
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

        _deepSyncMeta: function (packet, seen) {
            if (isArray(packet)) {
                packet.forEach(function (p) {
                    this._deepSyncMeta(p, seen);
                }, this);
                return;
            }
            if (seen.indexOf(packet) !== -1) { return; }
            seen.push(packet);
            var obj = this.getObject(packet);
            if (obj) {
                obj.importMeta(packet, this);
            }
            var links = packet.getLinks(), linkName;
            for (linkName in links) {
                this._deepSyncMeta(links[linkName], seen);
            }
        },
        deepSyncMeta: function (packet) {
            this._deepSyncMeta(packet, []);
        },

        // links will be SerializationPackets having serialized == false until serialize(linkedObj) will be called
        // ISerializable | ISerializable[] obj
        // returns SerializationPacket
        _serialize: function (obj, force) {
            if (isArray(obj)) {
                return obj.map(this._serialize, this);
            }
            invariant(serializable.looksLikeSerializable(obj), "obj must be ISerializable or ISerializable[]");
            var packet = this.getPacket(obj);

            if (!packet.isSerialized || force) {
                packet.isSerialized = true;
                obj.serialize(packet, this);

                var links = packet.getLinks(), linkName;
                for (linkName in links) {
                    this.serializeIfNeeded(links[linkName]);
                }
            }

            return packet;
        },

        serialize: function (obj) {
            return this._serialize(obj, true);
        },

        serializeIfNeeded: function (packet) {
            if (isArray(packet)) { packet.forEach(this.serializeIfNeeded, this); return; }
            if (packet === SerializationPacket.nullPacket) { return; }
            var obj = this.getObject(packet);
            invariant(serializable.looksLikeSerializable(obj), "obj must be ISerializable or ISerializable[]");
            if (obj && obj.serializationNeeded()) {
                this._serialize(obj);
            }
        },

        // packet should have all needed links at this point
        // SerializationPacket | SerializationPacket[] packet, Type constructor
        // constructor can be omitted if the corresponding packet is guaranteed to be deserialized (throws otherwise)
        deserialize: function (packet, constructor, thisArg) {
            if (isArray(packet)) {
                return packet.map(function (p) {
                    return this.deserialize(p, constructor, thisArg);
                }, this);
            }
            // todo temp:
            if (packet === undefined) {
                throw new Error("got undefined packet. Ensure the corresponding entry is listed in deserialization scheme");
            }
            invariant(packet instanceof SerializationPacket, "packet must be SerializationPacket or SerializationPacket[]");
            if (packet === SerializationPacket.nullPacket) {
                return null;
            }
            var object = this.getObject(packet);
            if (!object) {
                if (!isFunction(constructor)) {
                    throw new Error("All needed instances must be already deserialized by this point");
                }
                object = constructor.call(thisArg, packet);
                invariant(serializable.looksLikeSerializable(object), "Cannot deserialize to non-ISerializable");
                this._setObject(packet, object);
                object.importMeta(packet, this);
                object.deserialize(packet, this);
            }
            return object;
        }

    });

    module.exports = SerializationContext;
