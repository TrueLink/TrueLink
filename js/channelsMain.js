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
            console.log("deser A");
            this.name = String.fromCharCode(packet.getData().name);
            this.links = context.deserialize(packet.getLink("l1"), A);
            this.oneLink = context.deserialize(packet.getLink("l2"), A);
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

            var ctx = new SerializationContext();
            ctx.on("serialized", dump, null);

            function dump(packets, context) {

                function getObjectId(packet) {
                    if (packet === SerializationPacket.nullPacket) {
                        return null;
                    }
                    var obj = context.getObject(packet);
                    obj.id = obj.id || newUid();
                    return obj.id + "(" + obj.name + ")";
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

                var data = {};
                var links = [];

                packets.forEach(function (packet) {
                    data[getObjectId(packet)] = packet.getData();
                    var l = packet.getLinks(), linkName;
                    for (linkName in l) {
                        links = links.concat([].concat(l[linkName]).map(createLink.bind(null, packet, linkName, !$.isArray(l[linkName]))));
                    }
                });

                console.log(data);
                console.log(links);
            }

            ctx.serialize(level1);
//            ctx.serialize(level2_1);
            ctx.serialize(level2_2);
            ctx.serialize(level3);

        });
    });
}(require, window.document));