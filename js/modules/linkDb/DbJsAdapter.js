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

        },
        addDeletedLink: function (fromRevId, fromId, toId, type) {
        },
        getAllLinksTo: function (id, type) {

        },

        // WARNING link.fromRevId is meaningless here because we assume the database non-coherent.
        // link is just one of having common fromId ones
        getLinksTo: function (id, type) {

        },
        // WARNING see above
        getLinksFrom: function (id, type) {

        },

        getAnyLink: function (fromId, toId) {

        },
        getLink: function (fromId, toId, type) {

        },

        getAllLinksFrom: function (id, type) {

        },
        /*
        * TEMP SOLUTION
        * */
        getAllLinks: function () {

        },
        setAllLinks: function (links) {

        },
        getAllEntities: function () {

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