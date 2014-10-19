"use strict";

import SerializationPacket = require("../modules/serialization/SerializationPacket");
var nullPacket = SerializationPacket.nullPacket;
import $ = require("zepto");
var isArray = $.isArray;
import lf = require("localforage");

var lnks = [];
var objs = {};

var priv = {
    loadLocalForage: function(){
        console.log("fetching from localForage...");
        return lf.getItem<string>("links").then(function(linkJson){
            try{
                lnks = JSON.parse(linkJson) || [];
            }catch(e){
                console.log(e);
                lnks=[];
            }
            return lf.getItem<string>("objs");
        }).then(function(objJson){
            try{
                objs = JSON.parse(objJson) || {};
            }catch(e){
                console.log(e);
                lnks=[];
            }
        }).then(function(){console.log("lf fetch finished")});
    },

    dump: function () {
        console.log("writing localForage...");
        return lf.setItem("objs", JSON.stringify(objs)).then(function(){
            return lf.setItem("links", JSON.stringify(lnks)); // "object cannot be cloned"
        }).then(function(){console.log("lf commit finished")});
    },

    getLinks: function (fromId, type) {
        return lnks.filter(function (l) {
            return l.fromId === fromId && l.type === type;
        });
    },

    indexOfLink: function (fromId, type) {
        var i;
        for (i = 0; i < lnks.length; i += 1) {
            if (lnks[i].fromId === fromId && lnks[i].type === type) {
                return i;
            }
        }
        return -1;
    },


    removeLinks: function (fromId, linkName) {
        var index;
        while ((index = priv.indexOfLink(fromId, linkName)) !== -1) {
            lnks.splice(index, 1);
        }
    },

    addLink: function (fromId, toId, linkName) {
        lnks.push({
            fromId: fromId,
            toId: toId,
            type: linkName
        });
    },

    save: function (data) {
        objs[data.id] = $.extend({}, data);
    },

    getById: function (id) {
        if (!objs[id]) {
            return null;
        }
        return $.extend({}, objs[id]);
    },

    clear: function () {
        lnks = [];
        objs = {};
        return lf.setItem("objs", {}).then(function(){
            return lf.setItem("links", []);
        }).then(function(){console.log("lf erase finished")});
    }
}
var fake = {
    getById: priv.getById,
    save: priv.save,
    addLink: priv.addLink,
    removeLinks: priv.removeLinks,
    getLinks: priv.getLinks,
    clear: priv.clear,
    commit: priv.dump,
    init: priv.loadLocalForage
};

window.fakeDb = fake;

export = fake;
