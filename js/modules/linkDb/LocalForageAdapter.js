define(["interface/linkDb", "sc_console", "localforage"], function (lib, console, localforage) {
    "use strict";

    var extend = lib.extend;
    var async = lib.async;
    var when = lib.when;

    function LocalForageAdapter(dbName) {
        this.objDb = undefined;
        this.linkDb = undefined;
        this.objDbName = dbName + "_o";
        this.linkDbName = dbName + "_l";
        var that = this;
        this.openPromise = when(async(this, function (dfd) {
            localforage.getItem(that.objDbName)
                .then(function (objData) {
                    that.objDb = objData || {};
                }).then(function () {
                    return localforage.getItem(that.linkDbName);
                }).then(function (linkData) {
                    that.linkDb = linkData || {};
                }).then(function () {
                    dfd.resolve(true);
                }, function (error) {
                    dfd.reject({"error" : "system_error", "reason" : error});
                });
        })());
    }

    extend(LocalForageAdapter.prototype, {
        put: function (obj) {

            var savePromise = async(this, function (dfd) {
                if (!obj.id) {
                    dfd.reject({"error" : "argument_exception", "reason" : "put() requires obj.id"});
                    return;
                }
                this._insert(obj).then(function () {
                    console.log("added entity " + obj.id + "(" + obj.revId + ")");
                    dfd.resolve(obj);
                }, function (error) {
                    dfd.reject({"error" : "system_error", "reason" : error});
                });
            });
            return when(this.openPromise).then(savePromise);
        },
        getById: function (id, hideDebugMessage) {
            var loadPromise = async(this, function (dfd) {
                var db = this.objDb, obj, objectIdIndex;
                if (!db.hasOwnProperty(id)) {
                    if (!hideDebugMessage) { console.log("entity with id " + id + " not found"); }
                    dfd.reject({"error" : "not_found", "reason" : "missing"});
                    return;
                }
                for (objectIdIndex = 0; objectIdIndex < db[id].length; objectIdIndex++) {
                    if (db[id][objectIdIndex].isHead) {
                        obj = db[id][objectIdIndex];
                        break;
                    }
                }
                if (!obj) {
                    dfd.reject({"error" : "inconsistency", "reason" : "no head revision found for id " + id});
                    return;
                }
                obj = extend({}, obj);
                delete obj.isHead;
                dfd.resolve(obj);
            });
            return when(this.openPromise).then(loadPromise);
        },
        // TODO improvement: getAllByIds
        getAllById: function (id) {
            var loadPromise = async(this, function (dfd) {
                var db = this.objDb, obj, objectIdIndex;
                if (!db.hasOwnProperty(id)) {
                    console.log("entities with id" + id + " not found");
                    dfd.reject({"error" : "not_found", "reason" : "missing"});
                    return;
                }
                dfd.resolve(db[id].map(function (obj) {
                    obj = extend({}, obj);
                    delete obj.isHead;
                    return obj;
                }));
            });
            return when(this.openPromise).then(loadPromise);
        },
        addLink: function (fromRevId, fromId, toId, type, isDeleted) {
            var addLinkPromise = async(this, function (dfd) {
                var db = this.linkDb;
                if (!db.hasOwnProperty(type)) {
                    db[type] = [];
                }
                var link = {
                    fromRevId: fromRevId,
                    fromId: fromId,
                    toId: toId,
                    type: type
                };
                // kinda memory saving lol
                if (isDeleted) {
                    link.isDeleted = true;
                }
                db[type].push(link);

                this._dumpLinks().then(function () {
                    console.log("added " + (isDeleted ? "deleted " : "") + "link from " + fromId + "(" + fromRevId + ") to " + toId + ", type " + type);
                    dfd.resolve(extend({}, link));
                }, function (error) {
                    dfd.reject({"error" : "system_error", "reason" : error});
                });
            });
            return when(this.openPromise).then(addLinkPromise);
        },
        addDeletedLink: function (fromRevId, fromId, toId, type) {
            return this.addLink(fromRevId, fromId, toId, type, true);
        },
        _getLinksBy: function (fn, type) {
            var db = this.linkDb, i, links = [];
            if (!db.hasOwnProperty(type)) { return []; }
            for (i = 0; i < db[type].length; i++) {
                if (fn(db[type][i])) {
                    links.push(db[type][i]);
                }
            }
            return links;
        },
        // TODO: get links of all types: getLinksFrom(id)
        getAllLinksTo: function (id, type) {
            var getLinksToPromise = async(this, function (dfd) {
                if (!type) {
                    dfd.reject(({"error" : "argument_exception", "reason" : "argument exception: agrument 'type' missing"}));
                    return;
                }
                var links = this._getLinksBy(function (link) {
                    return link.toId === id;
                }, type);
                dfd.resolve(links);
            });
            return when(this.openPromise).then(getLinksToPromise);
        },
        _getWhereSum: function (items, groupFn, sumFn) {
            var i, link, groups = {}, group, resultLinks = [];
            for (i = 0; i < items.length; i++) {
                link = items[i];
                group = groupFn(link);
                groups[group] = groups[group] || { links: [], sum: 0 };
                groups[group].links.push(link);
                groups[group].sum += link.isDeleted ? -1 : 1;
            }
            for (group in groups) {
                if (groups.hasOwnProperty(group) && sumFn(groups[group].sum)) {
                    resultLinks.push(groups[group].links.pop());
                }
                if (groups[group].sum > 1 || groups[group].sum < 0) {
                    console.log(Math.abs(groups[group].sum) + (groups[group].sum < 0 ? " deleted" : "") + " links in group " + group);
                }
            }
            return resultLinks;
        },
        // WARNING link.fromRevId is meaningless here because we assume the database non-coherent.
        // link is just one of having common fromId ones
        getLinksTo: function (id, type) {
            var that = this;
            var getFn = function (allLinksTo) {
                return that._getWhereSum(allLinksTo, function (link) {
                    return link.fromId;
                }, function (sum) { return sum === 1; });
            };
            return when(this.getAllLinksTo(id, type)).then(getFn);
        },
        // WARNING see above
        getLinksFrom: function (id, type) {
            var that = this;
            var getFn = function (allLinksFrom) {
                return that._getWhereSum(allLinksFrom, function (link) {
                    return link.toId;
                }, function (sum) { return sum === 1; });
            };
            return when(this.getAllLinksFrom(id, type)).then(getFn);
        },

        getLink: function (fromId, toId, type) {
            return this.getLinksFrom(fromId, type).then(function (links) {
                var i;
                for (i = 0; i < links.length; i++) {
                    if (links[i].toId === toId) {
                        return links[i];
                    }
                }
                return null;
            });
        },

        getAllLinksFrom: function (id, type) {
            var getLinksFromPromise = async(this, function (dfd) {
                if (!type) {
                    dfd.reject(({"error" : "argument_exception", "reason" : "argument exception: agrument 'type' missing"}));
                    return;
                }
                var links = this._getLinksBy(function (link) {
                    return link.fromId === id;
                }, type);
                dfd.resolve(links);
            });
            return when(this.openPromise).then(getLinksFromPromise);
        },
        /*
        * TEMP SOLUTION
        * */
        getAllLinks: function () {
            var exportPromise = async(this, function (dfd) {
                dfd.resolve(this.linkDb);
            });
            return when(this.openPromise).then(exportPromise);
        },
        setAllLinks: function (links) {
            var importPromise = async(this, function (dfd) {
                this.linkDb = links;
                this._dumpLinks().then(function () {
                    dfd.resolve(true);
                });
            });
            return when(this.openPromise).then(importPromise);
        },
        getAllEntities: function () {
            var exportPromise = async(this, function (dfd) {
                dfd.resolve(this.objDb);
            });
            return when(this.openPromise).then(exportPromise);
        },
        setAllEntities: function (entities) {
            var importPromise = async(this, function (dfd) {
                this.objDb = entities;
                this._dumpObjs().then(function () {
                    dfd.resolve(true);
                });
            });
            return when(this.openPromise).then(importPromise);
        },
        drop: function () {
            var that = this;
            var dropPromise = async(this, function (dfd) {
                localforage.removeItem(that.objDbName).then(function () {
                    return localforage.removeItem(that.linkDbName);
                }).then(function () {
                    that.objDb = {};
                    that.linkDb = {};
                    dfd.resolve(that);
                });
            });
            return when(this.openPromise).then(dropPromise);
        },
        _insert: function (obj) {
            var id = obj.id, db = this.objDb;
            if (!db.hasOwnProperty(id)) {
                db[id] = [];
            } else {
                // update objects set isHead=false where id=obj.id
                var objectIdIndex;
                for (objectIdIndex = 0; objectIdIndex < db[id].length; objectIdIndex++) {
                    db[id][objectIdIndex].isHead = false;
                }
            }
            var detached = extend({}, obj);
            detached.isHead = true;
            db[id].push(detached);
            return this._dumpObjs();
        },
        _dumpLinks: function () {
            return localforage.setItem(this.linkDbName, this.linkDb);
        },
        _dumpObjs: function () {
            return localforage.setItem(this.objDbName, this.objDb);
        }
    });
    return LocalForageAdapter;
});