define([], function () {
    "use strict";
    function Dictionary() {
        this._items = [];
    }

    Dictionary.prototype = {
        item: function (key, value) {
            if (key === undefined) {
                throw new Error("key is undefined");
            }
            if (value === undefined) {
                return this.first(function (item) { return item.key === key; });
            }
            this.remove(key);
            this._items.push({
                key: key,
                value: value
            });
        },
        where: function (filterFn) {
            return this._items.filter(filterFn);
        },
        items: function () {
            return this._items;
        },
        first: function (searchFn) {
            var index = this._indexOf(searchFn);
            return index === -1 ? undefined : this._items[index];
        },
        remove: function (key) {
            var index = this._indexOf(function (item) { return item.key === key; });
            if (index === -1) { return; }
            this._items.splice(index, 1);
        },

        _indexOf: function (fn) {
            var i;
            for (i = 0; i < this._items.length; i += 1) {
                if (fn(this._items[i])) {
                    return i;
                }
            }
            return -1;
        },

        count: function (filterFn) {
            return filterFn ? this.where(filterFn).length : this._items.length;
        },

        keys: function () {
            return this._items.map(function (item) {
                return item.key;
            });
        },

        values: function () {
            return this._items.map(function (item) {
                return item.value;
            });
        }
    };

    return Dictionary;
});