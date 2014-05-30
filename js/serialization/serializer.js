// serializer / sync
define(function (require, exports, module) {
    "use strict";

    var db = require("serialization/fakeDb");
    var SerializationContext = require("modules/serialization/SerializationContext");
    var SerializationPacket = require("modules/serialization/SerializationPacket");
    var $ = require("zepto");
    var isArray = $.isArray;
    var newUuid = require("uuid");
    var RootFactory = require("./factories/rootFactory");
    var extend = require("extend");

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

        createPacket: function (id, scheme, context, counterObj) {
            context = context || {};
            if (context[id]) { return context[id]; }

            var packetData = db.getById(id);
            if (!packetData) { return null; }

            counterObj.dataLength += JSON.stringify(packetData).length;
            var packet = this.dataToPacket(packetData), linkName;
            context[id] = packet;
            counterObj.objCount += 1;

            //if (isArray)
            var links, that = this;
            for (linkName in scheme) {
                links = db.getLinks(id, linkName);
                counterObj.linkCount += links.length;
                if (isArray(scheme[linkName])) {
                    packet.setLink(linkName, links.map(function (link) {
                        return that.createPacket(link.toId, scheme[linkName][0], context, counterObj);
                    }));
                } else {
                    if (links.length > 0) {
                        packet.setLink(linkName, that.createPacket(links[0].toId, scheme[linkName], context, counterObj));
                    } else {
                        packet.setLink(linkName, SerializationPacket.nullPacket);
                    }
                }
            }
            return packet;
        },

        updateObjCache: function (context) {
            var that = this;
            context.getObjects().forEach(function (obj) {
                var id = obj.getMeta().id;
                if (!id) { return; }
                that.objCache[id] = obj;
            });
        },

        deserialize: function (packet, constructor) {
            var deserContext = new SerializationContext();
            var obj = deserContext.deserialize(packet, constructor);
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
            var that = this;
            if (isArray(packet)) {
                packet.forEach(function (p) { that.storeLinks(p, seen, counterObj); });
                return;
            }
            if (seen.indexOf(packet) !== -1) { return; }
            seen.push(packet);
            // packet was not changed
            if (!packet.isSerialized) { return; }
            var links = packet.getLinks(), linkName;
            for (linkName in links) {
                that._storeLinks(packet, linkName, links[linkName], counterObj);
                that.storeLinks(links[linkName], seen, counterObj);
            }
        },

        storeContext: function (context) {

            var counterObj = {
                dataLength: 0,
                linkCount: 0
            };
            var packets = context.getPackets();
            var that = this;
            packets.forEach(function (packet) {
                if (!packet.isSerialized) { return; }
                var meta = packet.getMetaData();
                if (!meta.id) {
                    meta.id = meta.fixedId || newUuid();
                }
                var data = that.packetToData(packet);
                counterObj.dataLength += JSON.stringify(data).length;
                db.save(data);
            });
            packets.forEach(function (packet) {
                that.storeLinks(packet, [], counterObj);
            });
            context.deepSyncMeta(packets);
            this.updateObjCache(context);
            console.log("context stored: %s objects (~%s KB), %s links", packets.length, (counterObj.dataLength / 1024.0).toFixed(2), counterObj.linkCount);
            return packets;
        },

        storeRunningContext: function () {
            if (!this.runningContext) { return; }
            this.storeContext(this.runningContext);
            this.runningContext = null;
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
                this.app.factory = factory.createAppFactory(this.app);
            }
            return this.app;
        }
    });



    module.exports = Serializer;
});