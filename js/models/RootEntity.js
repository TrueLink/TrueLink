define(["linkDb/Entity", "zepto"], function (Entity, $) {
    "use strict";
    function RootEntity(entity) {
        this.entity = entity;
    }

    $.extend(RootEntity.prototype, {
        views: {
            "default": "HomePage"
        }
    });

    RootEntity.create = function (keys) {
        return new RootEntity(new Entity({keys: keys}));
    };

    return RootEntity;
});