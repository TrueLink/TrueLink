// serializer / sync
define(function (require, exports, module) {
    "use strict";

    var db = require("js/serialization/fakeDb");
    var SerializationContext = require("serialization/SerializationContext");
    var SerializationPacket = require("serialization/SerializationPacket");
    var $ = require("zepto");
    var isArray = $.isArray;
    var newUuid = require("uuid");


    var objCache = {};


    function packetToData(packet) {
        var data = packet.getData();
        data.id = packet.getMetaData().id;
        return data;
    }
    function dataToPacket(data) {
        var packet = new SerializationPacket();
        packet.setData(data);
        packet.setMetaData({id: data.id});
        return packet;
    }

    function createPacket(id, scheme, context) {
        context = context || {};
        if (context[id]) { return context[id]; }

        var packetData = db.getById(id);
        if (!packetData) { return null; }

        var packet = dataToPacket(packetData), linkName;
        context[id] = packet;

        //if (isArray)
        for (linkName in scheme) {
            var links = db.getLinks(id, linkName);
            if (isArray(scheme[linkName])) {
                packet.setLink(linkName, links.map(function (link) {
                    return createPacket(link.toId, scheme[linkName][0], context);
                }));
            } else {
                if (links.length > 0) {
                    packet.setLink(linkName, createPacket(links[0].toId, scheme[linkName], context));
                } else {
                    packet.setLink(linkName, SerializationPacket.nullPacket);
                }
            }
        }
        return packet;
    }

    function updateObjCache(context) {
        context.getObjects().forEach(function (obj) {
            var id = obj.getMeta().id;
            if (!id) { return; }
            objCache[id] = obj;
        });
    }

    function deserialize(packet, constructor) {
        var deserContext = new SerializationContext();
        var obj = deserContext.deserialize(packet, constructor);
        updateObjCache(deserContext);
        return obj;
    }


    function storeLinks(packet, seen) {
        if (isArray(packet)) {
            packet.forEach(function (p) { storeLinks(p, seen) });
            return;
        }
        if (seen.indexOf(packet) !== -1) { return; }
        seen.push(packet);
        var links = packet.getLinks(), linkName;
        for (linkName in links) {
            db.removeLinks(packet.getMetaData().id, linkName);
            var linkedArr = [].concat(links[linkName]);
            linkedArr.forEach(function (link) {
                if (link === SerializationPacket.nullPacket || !link.isSerialized) { return; }
                db.addLink(packet.getMetaData().id, link.getMetaData().id, linkName);
            });
            storeLinks(links[linkName], seen);
        }
    }

    function storeContext(context) {
        console.log("store context");
        var packets = context.getPackets();
        packets.forEach(function (packet) {
            var meta = packet.getMetaData();
            if (!meta.id) {
                meta.id = meta.fixedId || newUuid();
            }
            db.save(packetToData(packet));
        });
        var seen = [];
        packets.forEach(function (packet) {
            storeLinks(packet, seen);
        });
        context.deepSyncMeta(packets);
        updateObjCache(context);
        return packets;
    }

    var runningContext = null;
    function storeRunningContext() {
        if (!runningContext) { return; }
        storeContext(runningContext);
        runningContext = null;
    }
    function onObjectChanged(obj, sender) {
        if (!runningContext) {
            runningContext = new SerializationContext();
            setTimeout(storeRunningContext, 4);
        }
        runningContext.serialize(obj);
        var t = 1;
    }

    function listen(obj) {
        obj.on("changed", onObjectChanged, null);
    }

    function serialize(obj) {
        var context = new SerializationContext();
        context.deepSerialize(obj);
        storeContext(context);
    }

    module.exports = {
        createPacket: createPacket,
        deserialize: deserialize,
        serialize: serialize,
        listen: listen
    };
});