define(["linkDb/core", "linkDb/interface"], function (core, lib) {
    "use strict";
    var extend = lib.extend;
    var whenAll = lib.whenAll;
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


    function getLinkPromise(what, entity, withWhat, withEntity, isDeleted) {
        var dirAndType = getDirectionAndType(what, withWhat);
        var from = dirAndType.dir > 0 ? entity : withEntity;
        var to = dirAndType.dir < 0 ? entity : withEntity;
        return core.addLink(from, to, dirAndType.type, isDeleted);
    }


    function getDirectionAndType(type1, type2) {
        var type1S = makeSingular(type1);
        var type2S = makeSingular(type2);
        var i;
        for (i = 0; i < meta.length; i++) {
            if (meta[i].from === type1S && meta[i].to === type2S) {
                return {
                    dir: 1,
                    type: type1S + "_" + type2S
                };
            }
            if (meta[i].to === type1S && meta[i].from === type2S) {
                return {
                    dir: -1,
                    type: type2S + "_" + type1S
                };
            }
        }
        throw new Error("The link type between " + type1 + " and " + type2 + " is not configured");
    }

    function GetLinkedCommand(what, withWhat, entity) {
        var dirAndType = getDirectionAndType(what, withWhat);
        if (dirAndType.dir > 0) {
            this.getLinks = core.getLinksTo.bind(null, entity, dirAndType.type);
            this.linkIdKey = "fromId";
        } else {
            this.getLinks = core.getLinksFrom.bind(null, entity, dirAndType.type);
            this.linkIdKey = "toId";
        }
        this.sinceVal = null;
        this.resolver = this._entityFromLink;
    }

    GetLinkedCommand.prototype = {
        _entityFromLink: function (link, entityId) {
            return core.getById(entityId);
        },
        since: function (n) { this.since = n; return this; },
        resolve: function (r) { this.resolver = r; return this; },
        execute: function () {
            var that = this;
            return this.getLinks(this.sinceVal).then(function (links) {
                return whenAll(links.map(function (link) {
                    return that.resolver(link, link[that.linkIdKey]);
                }));
            });
        }
    };


    return {
        addLinkMeta: addLinkMeta,
        clearMeta: clearMeta,
        save: function (entity) {

        },
        getById: function (id) {

        },
        // get("type1").linkedWith("type2", entity)[.since(n)][.resolve(fn(link))].execute()
        get: function (what) {
            return {
                linkedWith: function (withWhat, withEntity) {
                    return new GetLinkedCommand(what, withWhat, withEntity);
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
        },
        core: core
    };
});