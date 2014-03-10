define(["linkDb/core", "interface/linkDb"], function (core, lib) {
    "use strict";
    var extend = lib.extend;
    var plurals = {}, meta = [];

    function clearMeta() {
        plurals = {};
        meta = [];
    }

    function addLinkMeta(fromSingular, fromPlural, toSingular, toPlural) {
        plurals[fromPlural] = fromSingular;
        plurals[toPlural] = toSingular;
        meta.push({from: fromSingular, to: toSingular});
    }

    function makeSingular(word) {
        if (plurals.hasOwnProperty(word)) {
            return plurals[word];
        }
        return word;
    }

    function getDirectionAndType(type1, type2) {
        var type1S = makeSingular(type1);
        var type2S = makeSingular(type2);
        var i;
        for (i = 0; i < meta.length; i++) {
            if (meta[i].from === type1S && meta[i].to === type2S) {
                return {dir: 1, type: type1S + "_" + type2S};
            }
            if (meta[i].to === type1S && meta[i].from === type2S) {
                return {dir: -1, type: type2S + "_" + type1S};
            }
        }
        throw new Error("The link type between " + type1 + " and " + type2 + " is not configured");
    }

    function getLoadPromise(what, withWhat, withEntity) {
        var dirAndType = getDirectionAndType(what, withWhat);
        return dirAndType.dir > 0 ?
                core.getLinkedTo(withEntity, dirAndType.type) :
                core.getLinkedFrom(withEntity, dirAndType.type);
    }

    function getLinkPromise(what, entity, withWhat, withEntity, isDeleted) {
        var dirAndType = getDirectionAndType(what, withWhat);
        var from = dirAndType.dir > 0 ? entity : withEntity;
        var to = dirAndType.dir < 0 ? entity : withEntity;
        return core.addLink(from, to, dirAndType.type, isDeleted);
    }

    return extend({
        addLinkMeta: addLinkMeta,
        clearMeta: clearMeta,
        get: function (what) {
            return {
                linkedWith: function (withWhat, withEntity) {
                    return getLoadPromise(what, withWhat, withEntity);
                }
            };
        },
        link: function (what, entity) {
            return {
                and: function (withWhat, withEntity) {
                    return getLinkPromise(what, entity, withWhat, withEntity);
                }
            };
        },
        unlink: function (what, entity) {
            return {
                and: function (withWhat, withEntity) {
                    return getLinkPromise(what, entity, withWhat, withEntity, true);
                }
            };
        }
    }, core);
});