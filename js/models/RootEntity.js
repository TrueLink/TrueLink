define(["linkDb/Entity"], function (Entity) {
    "use strict";
    function RootEntity(entity) {
        this.entity = entity;
    }

    RootEntity.create = function (keys) {
        return new RootEntity(new Entity({keys: keys}));
    };

    return RootEntity;
});