define(["linkDb/interface", "dbJs"], function (lib, dbJs) {
    "use strict";

    var extend = lib.extend;

    function LocalForageAdapter(dbName) {
        this.openPromise = dbJs.open({
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
        });
    }

    extend(LocalForageAdapter.prototype, {
        put: function (obj) {
            return this.openPromise.then(function (db) {
                return db.objects.add(obj);
            }).then(function () {
                return obj;
            });
        },
        getById: function (id, hideDebugMessage) {

        },
        getAllById: function (id) {

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

        }
    });
    return LocalForageAdapter;
});