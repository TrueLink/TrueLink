define(["interface/linkDb", "dbJs"], function (lib, dbJs) {
    "use strict";

    var extend = lib.extend;

    function LocalForageAdapter(dbName) {

    }

    extend(LocalForageAdapter.prototype, {
        put: function (obj) {


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