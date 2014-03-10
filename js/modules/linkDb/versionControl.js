define(["interface/linkDb"], function (lib) {
    "use strict";

    return {
        createId: function () {
            return lib.newUid();
        },
        prepareRevIds: function (entity) {
            if (entity.revId) {
                entity.prevRevId = entity.revId;
            }
            entity.revId = lib.newUid();
        }

    };
});