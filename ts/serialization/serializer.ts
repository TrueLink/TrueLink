// serializer / sync
    "use strict";
    import db = require("../serialization/fakeDb");
    import SerializationContext = require("../../modules/serialization/SerializationContext");
    import SerializationPacket = require("../../modules/serialization/SerializationPacket");
import $=require("zepto");
    var isArray = $.isArray;
    import newUuid = require("uuid");
    import RootFactory = require("./factories/rootFactory");
    import extend = require("../tools/extend");

    function Serializer() {
        this.objCache = {};
        this.app = null;
        this.runningContext = null;
    }

    extend(Serializer.prototype, {
        packetToData: function (packet) {
            var data = packet.getData();
            data.id = packet.getMetaData().id;
            return data;
        },
        dataToPacket: function (data) {
            var packet = new SerializationPacket();
            packet.setData(data);
            packet.setMetaData({id: data.id});
            return packet;
        },

        init: function(){
            return db.init();
        },

        createPacket: function (scheme, type, id, context, counterObj) {
            context = context || {};
            if (context[id]) { return context[id]; }

            var packetData = db.getById(id);
            if (!packetData) { return null; }
            //some hacky magic:
            var packet = this.dataToPacket(packetData);
            if(type === "_auto") {
                var d = packet.getData();
                if(!d._type_) {
                   throw new Error("Type information not found for a '_auto' packet type"); 
                }
                type = d._type_;
            }
            var typeDef = scheme[type];
            if (!typeDef) {
                throw new Error("type with name " + type + " is not found in the scheme");
            }

            counterObj.dataLength += JSON.stringify(packetData).length;
            context[id] = packet;
            counterObj.objCount += 1;

            var linkName, link, dbLinks;

            function createPacketFromDbLink(typeDefName, dbLink) {
                return this.createPacket(scheme, typeDefName, dbLink.toId, context, counterObj);
            }
            for (linkName in typeDef) {
                link = typeDef[linkName];
                dbLinks = db.getLinks(id, linkName);
                if (link.propType === "many") {
                    packet.setLink(linkName, dbLinks.map(createPacketFromDbLink.bind(this, link.type)));
                } else if (link.propType === "one") {
                    if (dbLinks.length > 0) {
                        packet.setLink(linkName, createPacketFromDbLink.call(this, link.type, dbLinks[0]));
                    } else {
                        packet.setLink(linkName, SerializationPacket.nullPacket);
                    }
                }
            }
            return packet;
        },

        updateObjCache: function (context) {
            context.getObjects().forEach(function (obj) {
                var id = obj.getMeta().id;
                if (!id) { return; }
                this.objCache[id] = obj;
            }, this);
        },

        deserialize: function (packet, constructor, thisArg) {
            var deserContext = new SerializationContext();
            var obj = deserContext.deserialize(packet, constructor, thisArg);
            this.updateObjCache(deserContext);
            return obj;
        },

        _storeLinks: function (packet, linkName, linkedPackets, counterObj) {
            db.removeLinks(packet.getMetaData().id, linkName);
            var linkedArr = [].concat(linkedPackets);

            linkedArr.forEach(function (linkedPacket) {
                if (linkedPacket === SerializationPacket.nullPacket) { return; }
                counterObj.linkCount += 1;
                db.addLink(packet.getMetaData().id, linkedPacket.getMetaData().id, linkName);
            });
        },

// recursively update all link info
        storeLinks: function (packet, seen, counterObj) {
            if (isArray(packet)) {
                packet.forEach(function (p) { this.storeLinks(p, seen, counterObj); }, this);
                return;
            }
            if (seen.indexOf(packet) !== -1) { return; }
            seen.push(packet);
            // packet was not changed
            if (!packet.isSerialized) { return; }
            var links = packet.getLinks(), linkName;
            for (linkName in links) {
                this._storeLinks(packet, linkName, links[linkName], counterObj);
                this.storeLinks(links[linkName], seen, counterObj);
            }
        },

        storeContext: function (context) {

            var counterObj = {
                dataLength: 0,
                linkCount: 0
            };
            var packets = context.getPackets();
            packets.forEach(function (packet) {
                if (!packet.isSerialized) { return; }
                var meta = packet.getMetaData();
                if (!meta.id) {
                    meta.id = meta.fixedId || newUuid();
                }
                var data = this.packetToData(packet);
                counterObj.dataLength += JSON.stringify(data).length;
                db.save(data);
            }, this);
            packets.forEach(function (packet) {
                this.storeLinks(packet, [], counterObj);
            }, this);
            context.deepSyncMeta(packets);
            this.updateObjCache(context);
            db.commit();
            console.log("context stored: %s objects (~%s KB), %s links", packets.length, (counterObj.dataLength / 1024.0).toFixed(2), counterObj.linkCount);
            return packets;
        },

        storeRunningContext: function () {
            if (!this.runningContext) { return; }
            var ctx = this.runningContext;
            this.runningContext = null;
            return this.storeContext(ctx);
        },
        onObjectChanged: function (obj, sender) {
            if (!this.runningContext) {
                this.runningContext = new SerializationContext();
                setTimeout(this.storeRunningContext.bind(this), 4);
            }
            this.runningContext.serialize(obj);
        },

        listen: function (obj) {
            obj.on("changed", this.onObjectChanged, this);
        },

        createApp: function () {
            if (!this.app) {
                var factory = new RootFactory(this);
                this.app = factory.createApp();
            }
            return this.app;
        }
    });

    export = Serializer;
