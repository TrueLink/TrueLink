define(["tools/invariant", "zepto"], function (invariant, $) {
    "use strict";
    function SerializationPacket() {
        this._data = {};
        this._links = {};
    }
    SerializationPacket.prototype = {
        getData: function () {
            return this._data;
        },
        setData: function (data) {
            invariant($.isPlainObject(data), "data must be plain object");
            this._data = data;
        },
        getLinks: function () {
            return this._links;
        },
        setLinks: function (links) {
            invariant((typeof links === "object") && (links !== null), "links must be an object");
            var key;
            for (key in links) {
                if (links.hasOwnProperty(key)) {
                    invariant(links[key] instanceof SerializationPacket, "all links must be packets");
                }
            }
            this._links = links;
        }
    };
    return SerializationPacket;
});