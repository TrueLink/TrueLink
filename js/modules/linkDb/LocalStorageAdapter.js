define(["interface/linkDb", "sc_console"], function (lib, console) {
    "use strict";

    var extend = lib.extend;
    var async = lib.async;
    var when = lib.when;
    // getItem, setItem and removeItem are used
    var ls = window.localStorage;

    function LocalStorageAdapter(dbName) {
        this.objDb = undefined;
        this.linkDb = undefined;
        this.objDbName = dbName + "_o";
        this.linkDbName = dbName + "_l";
        // execute right now:
        this.openPromise = when(async(this, function (dfd) {
            var objData = ls.getItem(this.objDbName) || "{}";
            var linkData = ls.getItem(this.linkDbName) || "{}";
            this.objDb = JSON.parse(objData);
            this.linkDb = JSON.parse(linkData);
            dfd.resolve(this);
        })());
    }

    extend(LocalStorageAdapter.prototype, {
        put: function (obj) {
            var savePromise = async(this, function (dfd) {
                if (!obj.id) {
                    dfd.reject({"error" : "argument_exception", "reason" : "put() requires obj.id"});
                    return;
                }
                try {
                    var saved = this._insert(obj);
                    dfd.resolve(saved);
                } catch (ex) {
                    dfd.reject({"error" : "system_error", "reason" : ex.message});
                }
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
                try {
                    this._dumpLinks();
                    console.log("added " + (isDeleted ? "deleted " : "") + "link from " + fromId + "(" + fromRevId + ") to " + toId + ", type " + type);
                } catch (ex) {
                    dfd.reject({"error" : "system_error", "reason" : ex.message});
                    return;
                }
                dfd.resolve(extend({}, link));
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
        drop: function () {
            var dropPromise = async(this, function (dfd) {
                ls.removeItem(this.objDbName);
                ls.removeItem(this.linkDbName);
                this.objDb = {};
                this.linkDb = {};
                dfd.resolve(this);
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
            this._dumpObjs();
            console.log("added entity " + obj.id + "(" + obj.revId + ")");
            return obj;
        },
        _dumpLinks: function () {
            try {
                ls.setItem(this.linkDbName, JSON.stringify(this.linkDb));
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        _dumpObjs: function () {
            try {
                ls.setItem(this.objDbName, JSON.stringify(this.objDb));
            } catch (err) {
                console.error(err);
                throw err;
            }
        }
    });
    return LocalStorageAdapter;
});