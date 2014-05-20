define(function (require, exports, module) {
    "use strict";

    var SerializationPacket = require("serialization/SerializationPacket");
    var nullPacket = SerializationPacket.nullPacket;
    var $ = require("zepto");
    var isArray = $.isArray;

    var ls = localStorage;
    var linksData = ls.getItem("links");
    var lnks = linksData ? JSON.parse(linksData) : [];

    var objData = ls.getItem("objs");
    var objs = objData ? JSON.parse(objData) : {};

    function dump() {
        ls.setItem("objs", JSON.stringify(objs));
        ls.setItem("links", JSON.stringify(lnks));
    }

    function getLinks(fromId, type) {
        return lnks.filter(function (l) {
            return l.fromId === fromId && l.type === type;
        });
    }

    function indexOfLink(fromId, type) {
        var i;
        for (i = 0; i < lnks.length; i += 1) {
            if (lnks[i].fromId === fromId && lnks[i].type === type) {
                return i;
            }
        }
        return -1;
    }


    function removeLinks(fromId, linkName) {
        var index;
        while ((index = indexOfLink(fromId, linkName)) !== -1) {
            lnks.splice(index, 1);
        }
        dump();
    }

    function addLink(fromId, toId, linkName) {
        lnks.push({
            fromId: fromId,
            toId: toId,
            type: linkName
        });
        dump();
    }

    function save(data) {
        objs[data.id] = $.extend({}, data);
        dump();
    }

    function getById(id) {
        if (!objs[id]) { return null; }
        return $.extend({}, objs[id]);
    }

    module.exports = {
        getById: getById,
        save: save,
        addLink: addLink,
        removeLinks: removeLinks,
        getLinks: getLinks
    };
});