define(["linkDb/interface", "linkDb/versionControl"], function (lib, ver) {
    "use strict";

    var extend = lib.extend;

    // data entity to be saved in the databases
    function Entity(data, id) {
        // undefineds are important
        this.id             =  id === undefined ? ver.createId() : id;
        this.data           = data || undefined;
        this.revId          = undefined;    // to be defined later
        this.prevRevId      = undefined;
        this.dirty          = true;         // for dirty-checking
    }

    // deserialize from a db object
    Entity.deserialize = function (obj) {
        if (!obj) { return null; }
        obj = extend({}, obj);
        var newEntity = new Entity(null, null);
        var prop;
        for (prop in newEntity) {
            if (newEntity.hasOwnProperty(prop)) {
                switch (Entity.serializedFields[prop]) {
                case Entity.SERIALIZED_PLAIN:
                    newEntity[prop] = obj[prop];
                    break;
                case Entity.SERIALIZED_ENCRYPTED:
                    if (obj._protected && obj._protected.hasOwnProperty(prop)) {
                        newEntity[prop] = obj._protected[prop];
                    }
                    break;
                default:
                    break;
                }
            }
        }
        newEntity.dirty = false;
        return newEntity;
    };

    Entity.SERIALIZED_PLAIN = 1;
    Entity.SERIALIZED_ENCRYPTED = 2;
    Entity.NOT_SERIALIZED = 3;
    // fields to be exported/imported to a plain object
    Entity.serializedFields = {
        id:         Entity.SERIALIZED_PLAIN,
        data:       Entity.SERIALIZED_ENCRYPTED,
        revId:      Entity.SERIALIZED_PLAIN,
        prevRevId:  Entity.SERIALIZED_ENCRYPTED,
        dirty:      Entity.NOT_SERIALIZED
    };

    extend(Entity.prototype, {
        getData: function (key) {
            if (!key || this.data === undefined) { return this.data; }
            if (key.indexOf(".") === -1) {
                return this.data.hasOwnProperty(key) ? this.data[key] : undefined;
            } else {
                var parentKey = key.slice(0, key.lastIndexOf("."));
                var thisKey = key.slice(key.lastIndexOf(".") + 1);
                var parent = this.getData(parentKey);
                if (parent === undefined) {
                    return undefined;
                } else {
                    return parent.hasOwnProperty(thisKey) ? parent[thisKey] : undefined;
                }
            }
        },
        setData: function (keyOrValue, value) {
            // TODO someday chek for data changes OR store data mirror
            this.dirty = true;

            if (value === undefined) { this.data = keyOrValue; return; }
            var key = keyOrValue;
            if (key.indexOf(".") === -1) {
                if (this.data === undefined) { this.data = {}; }
                this.data[keyOrValue] = value;
            } else {
                var parentKey = key.slice(0, key.lastIndexOf("."));
                var thisKey = key.slice(key.lastIndexOf(".") + 1);
                var parent = this.getData(parentKey);
                if (parent === undefined) {
                    parent = {};
                    this.setData(parentKey, parent);
                }
                parent[thisKey] = value;
            }
        },
        // may be changed to data mirror later
        isDirty: function () {
            return this.dirty;
        },
        isNew: function () {
            return this.id === 0;
        },
        clean: function () {
            this.dirty = false;
        },
        makeDirty: function () {
            this.dirty = true;
        },

        // serialize to a db object
        serialize: function () {
            var obj = { _protected: {} };
            var prop;
            for (prop in this) {
                if (this.hasOwnProperty(prop)) {
                    switch (Entity.serializedFields[prop]) {
                    case Entity.SERIALIZED_PLAIN:
                        obj[prop] = this[prop];
                        break;
                    case Entity.SERIALIZED_ENCRYPTED:
                        obj._protected[prop] = this[prop];
                        break;
                    default:
                        break;
                    }
                }
            }
            return extend({}, obj);
        }
    });
    return Entity;

});