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
        this.name = "A";
        this.c = null;
    }
    A.prototype = {
        serialize: function (packet) {
            console.log("ser A");
            packet.setData({
                name: this.name.charCodeAt(0)
            });
            packet.setLink("c", this.c);
        }
    };

    function B() {
        this.name = "B";
        this.a = null;
    }
    B.prototype = {
        serialize: function (packet) {
            console.log("ser B");
            packet.setData({
                name: this.name.charCodeAt(0)
            });
            packet.setLink("a", this.a);
        }
    };

    function C() {
        this.name = "C";
        this.b = null;
    }
    C.prototype = {
        serialize: function (packet) {
            console.log("ser C");
            packet.setData({
                name: this.name.charCodeAt(0)
            });
            packet.setLink("b", this.b);
        }
    };


    require([
        "modules/channels/tlkeBuilderUser",
        "tools/random",
        "modules/data-types/Hex",
        "zepto",
        "modules/channels/TestTransport",
        "modules/serialization/SerializationContext",
        "modules/serialization/log"
    ], function (TlkeBuilderUser, random, Hex, $, TestTransport, SerializationContext, log) {
        $(function () {

            var a = new A();
            var b = new B();
            var c = new C();
            b.a = a;
            c.b = b;
            a.c = c;


            var ctx = new SerializationContext();
            ctx.saveCb = function (packets) {
                console.group("dump");
                packets.forEach(log);
                console.groupEnd();
            };

            ctx.serialize(a);
            ctx.serialize(b);
            ctx.serialize(c);
        });
    });
}(require, window.document));