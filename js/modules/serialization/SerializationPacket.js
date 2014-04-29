define(["tools/invariant", "zepto"], function (invariant, $) {
    "use strict";
    function SerializationPacket() {
        this._data = {};
        this._links = {};
        this._linkedObjs = {};
    }
    SerializationPacket.prototype = {
        getData: function () {
            return this._data;
        },
        setData: function (data) {
            invariant($.isPlainObject(data), "data must be plain object");
            this._data = data;
        },
//        getLink: function (name) {
//            invariant(name, "missing link name");
//            return this._links[name];
//        },
        getLinkedObjs: function () {
            return this._linkedObjs;
        },
        setLink: function (name, linkObj) {
            invariant(name, "missing link name");
            this._linkedObjs[name] = linkObj;
        },

        setLinkedPacket: function (name, packet) {
            this._links[name] = packet;
        },

        getLinkedPackets: function () {
            return this._links;
        }
    };

    SerializationPacket.empty = new SerializationPacket();

    return SerializationPacket;
});