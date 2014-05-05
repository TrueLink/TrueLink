(function (require, document) {
    "use strict";
    require.config({
        baseUrl: "/js",
        paths: {
            "react": "lib/react",
            "zepto": "lib/zepto",
            "zepto_fx": "lib/zepto.fx",
            "q": "lib/q",
            "es5Shim": "lib/es5-shim.min",
            "idbShim": "lib/idb-shim.min",
            "dbJs": "lib/db",
            "whenAll": "tools/resolve",
            "linkDb": "modules/linkDb",
            "db": "services/db",
            "settings": "services/settings"
        },
        shim: {
            "zepto": { exports: "Zepto" },
            "zepto_fx": { deps: ["zepto"] }
        }
    });

    define("addons", ["zepto_fx", "lib/es5-shim.min", "lib/idb-shim.min", "tools/resolve"], function () {});


    function A() {
        this.name = null;
        this.links = [];
        this.oneLink = null;
    }
    A.prototype = {
        serialize: function (packet, context) {
            console.log("ser " + this.name);
            packet.setData({
                name: "+" + this.name + "+"
            });

            packet.setLink("arr", context.serializeLink(this.links));
            packet.setLink("single", context.serializeLink(this.oneLink));
        },

        deserialize: function (packet, context) {
            console.log("deser " + packet.getData().name);
            this.name = packet.getData().name.replace(/\+/g, "");
            this.links = context.deserialize(packet.getLink("arr"), A);
            this.oneLink = context.deserialize(packet.getLink("single"), A);
        }
    };



    require([
        "modules/channels/tlkeBuilderUser",
        "tools/random",
        "modules/data-types/Hex",
        "zepto",
        "modules/channels/TestTransport",
        "modules/serialization/SerializationContext",
        "modules/serialization/SerializationPacket",
        "modules/serialization/log",
        "tools/uuid"
    ], function (TlkeBuilderUser, random, Hex, $, TestTransport, SerializationContext, SerializationPacket, log, newUid) {
        $(function () {


            var level1 = new A();
            level1.name = "1";

            var level2_1 = new A();
            level2_1.name = "2_1";

            var level2_2 = new A();
            level2_2.name = "2_2";


            level1.links.push(level2_1);
            level1.links.push(level2_2);

            var level3 = new A();
            level3.name = "3";

            level3.links.push(level1);
            level2_1.links.push(level3);
            level2_2.links.push(level3);

            level1.oneLink = level3;

            var ctx = new SerializationContext();
            ctx.on("serialized", dump, null);

            var fakeDb = {
                data: {},
                links: []
            };

            function dump(packets, context) {

                function getObjectId(packet) {
                    if (packet === SerializationPacket.nullPacket) {
                        return null;
                    }
                    var obj = context.getObject(packet);
                    obj.id = obj.id || newUid();
                    return obj.id;
                }

                // isExclusive (1-1): object can have only one linked object of this type. Any existing link must be deleted
                // all not-exclusive (1-∞) links that can be found in the db by group(from, type) but are not present in this list
                // must also be deleted
                function createLink(packet, linkName, isExclusive, link) {
                    return {
                        from: getObjectId(packet),
                        to: getObjectId(link),
                        type: linkName,
                        exclusive: isExclusive
                    };
                }

                function storePacket(packet) {
                    fakeDb.data[getObjectId(packet)] = packet.getData();
                    var l = packet.getLinks(), linkName;
                    for (linkName in l) {
                        fakeDb.links = fakeDb.links.concat([].concat(l[linkName]).map(createLink.bind(null, packet, linkName, !$.isArray(l[linkName]))));
                    }
                }

                packets.forEach(storePacket);

                deserialize();
            }

            function deserialize() {

                var db = $.extend(true, {}, fakeDb);
                //level1.id;

                var packets = {};
                for (var id in db.data) {
                    packets[id] = new SerializationPacket();
                    packets[id].id = id;
                    packets[id].setData(db.data[id]);
                }

                for(var i = 0; i < db.links.length; i++) {
                    var link = db.links[i];
                    var linkedPacket = link.to ? packets[link.to] : SerializationPacket.nullPacket;
                    if (link.exclusive) {
                        packets[link.from].setLink(link.type, linkedPacket);
                    } else  {
                        var links = packets[link.from].getLink(link.type) || [];
                        links.push(linkedPacket);
                        packets[link.from].setLink(link.type, links);
                    }
                }


                var dctx = new SerializationContext();
                var deserialized = dctx.deserialize(packets[level1.id], A);
                console.log(deserialized);
            }

            ctx.serialize(level1);
            ctx.serialize(level2_1);
            ctx.serialize(level2_2);
            ctx.serialize(level3);

        });
    });
}(require, window.document));