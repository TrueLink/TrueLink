define(function (require, exports, module) {
    "use strict";

    var invariant = require("../invariant");
    var tools = require("../tools");
    var extend = tools.extend;
    var isArray = tools.isArray;
    var isPlainObject = tools.isPlainObject;

    function isPacketOrList(link) {
        if (link instanceof SerializationPacket) {
            return true;
        }
        if (isArray(link)) {
            for (var i = 0; i < link.length; i += 1) {
                if (!(link[i] instanceof SerializationPacket)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    function SerializationPacket() {
        this._data = {};
        this._metaData = {};
        this._links = {};

        this.isSerialized = false;
    }
    SerializationPacket.prototype = {
        getData: function () {
            return this._data;
        },
        setData: function (data) {
            invariant(isPlainObject(data), "data must be plain object");
            this._data = this._data ? extend(this._data, data) : data;
        },

        getMetaData: function () {
            return this._metaData;
        },
        setMetaData: function (data) {
            invariant(data === undefined || isPlainObject(data), "data must be plain object");
            this._metaData = this._metaData ? extend(this._metaData, data) : data;
        },

        getLink: function (linkName) {
            invariant(linkName, "missing linkName");
            return this._links[linkName];
        },
        setLink: function (linkName, link) {
            if(link === null || link === undefined) {
                this._links[linkName] = SerializationPacket.nullPacket;
                return;
            }
            invariant(linkName, "missing linkName");
            invariant(isPacketOrList(link), "link must be SerializationPacket or SerializationPacket[]");
            this._links[linkName] = link;
        },

        getLinks: function () {
            return this._links;
        },

        // todo temp
        toString: function () {
            var type = this._metaData.type || "unknown type";
            return type + " packet";
        }

    };
    SerializationPacket.nullPacket = new SerializationPacket();
    SerializationPacket.nullPacket.setData({packetName: "nullPacket"});
    SerializationPacket.nullPacket.isSerialized = true;

    module.exports = SerializationPacket;
});