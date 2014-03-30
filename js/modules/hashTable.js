define([], function () {
    "use strict";
    function HashTable() {
        this.items = [];
    }

    HashTable.prototype = {
        setItem: function (key, value) {
            if(key === undefined) {
                throw new Error("key is undefined");
            }
            this.removeItem(key);
            this.items.push({
                key: key,
                value: value
            });
        },
        each: function (fn) {
            this.items.forEach(function (item) {
                fn(item.key, item.value);
            });
        },
        getItem: function (key, searchFunction) {
            var index;
            if (!searchFunction) {
                index = this._getIndexByKey(key);
            } else {
                index = this._indexOf(searchFunction);
            }
            return index === -1 ? undefined : this.items[index].value;
        },
        removeItem: function (key, searchFunction) {
            var index;
            if (!searchFunction) {
                index = this._getIndexByKey(key);
            } else {
                index = this._indexOf(searchFunction);
            }
            if (index !== -1) {
                this.items.splice(index, 1);
            }
        },

        // todo: filter by fn({key, value})
        filter: function (valueFilterFn) {
            return this.items.filter(function (item) {
                return valueFilterFn(item.value);
            });
        },

        fullFilter: function (fullFilterFn) {
            return this.items.filter(fullFilterFn);
        },

        first: function (valueFilterFn) {
            var found = this.filter(valueFilterFn);
            return found.length > 0 ? found[0] : undefined;
        },

        length: function (filterFn) {
            return filterFn ? this.items.filter(filterFn).length : this.items.length;
        },

        _getIndexByKey: function (key) {
            return this._indexOf(function (item) { return item.key === key; });
        },

        _indexOf: function (filterFn) {
            var index, items = this.items;
            for (index = items.length - 1; index > -1; index -= 1) {
                if (filterFn(items[index])) {
                    break;
                }
            }
            return index;
        }
    };

    return HashTable;
});