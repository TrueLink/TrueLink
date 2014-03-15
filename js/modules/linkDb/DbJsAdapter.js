define(["linkDb/interface", "dbJs"], function (lib, dbJs) {
    "use strict";

    var extend = lib.extend;
    var when = lib.when;
    var whenAll = lib.whenAll;

    function LocalForageAdapter(dbName) {
        this.openPromise = when(dbJs.open({
            server: dbName,
            version: 1,
            schema: {
                objects: {
                    key: { keyPath: "dbid", autoIncrement: true },
                    indexes: {
                        id: { },
                        revId: { }
                    }
                },
                links: {
                    key: { keyPath: "dbid", autoIncrement: true },
                    indexes: {
                        fromId: { },
                        toId: { },
                        type: { }
                    }
                }
            }
        }));
    }

    extend(LocalForageAdapter.prototype, {
        put: function (obj) {
            return this.openPromise.then(function (db) {
                return when(db.objects.query("id")
                    .only(obj.id)
                    .modify({isHead: false})
                    .execute())
                    .then(function () {
                        obj.isHead = true;
                        return when(db.objects.add(obj));
                    });
            });
        },
        getById: function (id) {
            return this.openPromise.then(function (db) {
                return when(db.objects.query("id")
                    .only(id)
                    .filter("isHead", true)
                    .execute())
                    .then(function (found) {
                        return found.length > 0 ? found[0] : null;
                    });
            });
        },
        addLink: function (fromRevId, fromId, toId, type, isDeleted) {
            var link = {
                fromRevId: fromRevId,
                fromId: fromId,
                toId: toId,
                type: type,
                isDeleted: isDeleted
            };
            return this.openPromise.then(function (db) {
                return when(db.links.add(link));
            });
        },
        addDeletedLink: function (fromRevId, fromId, toId, type) {
            return this.addLink(fromRevId, fromId, toId, type, true);
        },

        // WARNING link.fromRevId is meaningless here because we assume the database non-coherent.
        // every link is just one of having common fromId ones
        getLinksTo: function (id, type) {
            var that = this;
            return this.getAllLinksTo(id, type).then(function (links) {
                return that.getWhereSum(links, function (l) { return l.fromId; }, that.sumLinkAdded);
            });
        },
        // WARNING see above
        getLinksFrom: function (id, type) {
            var that = this;
            return this.getAllLinksFrom(id, type).then(function (links) {
                return that.getWhereSum(links, function (l) { return l.toId; }, that.sumLinkAdded);
            });
        },

        getAllLinksFrom: function (id, type) {
            return this.queryLinks({fromId: id, type: type});
        },
        getAllLinksTo: function (id, type) {
            return this.queryLinks({toId: id, type: type});
        },

        queryLinks: function (query) {
            if (!query.fromId && !query.toId) {
                throw new Error("Argument exception");
            }
            return this.openPromise.then(function (db) {
                var index = query.fromId ? "fromId" : "toId";
                var q = db.links.query(index).only(query[index]);
                if (query.toId && index !== "toId") {
                    q = q.filter("toId", query.toId);
                }
                if (query.type) {
                    q = q.filter("type", query.type);
                }
                return when(q.execute());
            });
        },

        hasAnyLink: function (fromId, toId) {
            return this.queryLinks({fromId: fromId, toId: toId}).then(function (links) {
                return links.length > 0;
            });
        },

        sumLinkDeleted: function (sum) { return sum === 0; },
        sumLinkAdded: function (sum) { return sum === 1; },
        sumLinkUnknown: function (sum) { return !this.sumLinkAdded(sum) && !this.sumLinkDeleted(sum); },

        getResultingLink: function (fromId, toId, type) {
            var that = this;
            return this.queryLinks({fromId: fromId, toId: toId, type: type}).then(function (links) {
                if (!links.length) {
                    return null;
                }
                var deleted = that.getWhereSum(links, null, that.sumLinkDeleted);
                if (deleted.length) {
                    return deleted[deleted.length - 1];
                }
                var added = that.getWhereSum(links, null, that.sumLinkAdded);
                if (added.length) {
                    return added[added.length - 1];
                }
                return null;
            });
        },

        getWhereSum: function (items, groupFn, sumFn) {
            var i, link, groups = {}, group, resultLinks = [];
            for (i = 0; i < items.length; i++) {
                link = items[i];
                group = groupFn ? groupFn(link) : "default";
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


        /*
        * TEMP SOLUTION
        * */
        getAllLinks: function () {
            return this.openPromise.then(function (db) {
                return when(db.links.query().all().execute());
            });
        },
        setAllLinks: function (links) {

        },
        getAllEntities: function () {
            return this.openPromise.then(function (db) {
                return when(db.objects.query().all().execute());
            });
        },
        setAllEntities: function (entities) {
        },
        drop: function () {
            return this.openPromise.then(function (db) {
                var p1 = db.objects.clear();
                var p2 = db.links.clear();
                return whenAll([p1, p2]);
            });
        }
    });
    return LocalForageAdapter;
});