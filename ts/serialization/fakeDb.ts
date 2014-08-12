    "use strict";

    var SerializationPacket = require("modules/serialization/SerializationPacket");
    var nullPacket = SerializationPacket.nullPacket;
    var $ = require("zepto");
    var isArray = $.isArray;

    var ls = localStorage;
    var linksData = ls.getItem("links");
    var lnks = linksData ? JSON.parse(linksData) : [];

    var objData = ls.getItem("objs");
    var objs = objData ? JSON.parse(objData) : {};

var priv = {
    dump : function () {
        ls.setItem("objs", JSON.stringify(objs));
        ls.setItem("links", JSON.stringify(lnks));
    },

   getLinks : function (fromId, type) {
        return lnks.filter(function (l) {
            return l.fromId === fromId && l.type === type;
        });
    },

              indexOfLink : function (fromId, type) {
        var i;
        for (i = 0; i < lnks.length; i += 1) {
            if (lnks[i].fromId === fromId && lnks[i].type === type) {
                return i;
            }
        }
        return -1;
    },


                            removeLinks : function (fromId, linkName) {
        var index;
        while ((index = priv.indexOfLink(fromId, linkName)) !== -1) {
            lnks.splice(index, 1);
        }
        priv.dump();
    },

                                          addLink : function (fromId, toId, linkName) {
        lnks.push({
            fromId: fromId,
            toId: toId,
            type: linkName
        });
        priv.dump();
    },

                                                    save : function (data) {
        objs[data.id] = $.extend({}, data);
        priv.dump();
    },

                                                    getById : function (id) {
        if (!objs[id]) { return null; }
        return $.extend({}, objs[id]);
    },

    clear : function () {
        lnks = [];
        objs = {};
        priv.dump();
    }
}
    var fake = {
        getById: priv.getById,
        save: priv.save,
        addLink: priv.addLink,
        removeLinks: priv.removeLinks,
        getLinks: priv.getLinks,
        clear: priv.clear
    };

    window.fakeDb = fake;

    export = fake;
