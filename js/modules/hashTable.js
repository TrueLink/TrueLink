define([], function () {
    "use strict";
    function HashTable() {
        this.items = [];
    }

    HashTable.prototype = {
        setItem: function (key, value) {
            this.removeItem(key);
            this.items.push({
                key: key,
                value: value
            });
        },
        getItem: function (key) {
            var index = this._getIndexByKey(key);
            return index === -1 ? undefined : this.items[index].value;
        },
        removeItem: function (key) {
            var index = this._getIndexByKey(key);
            if (index !== -1) {
                this.items.splice(index, 1);
            }
        },

        filter: function (valueFilterFn) {
            return this.items.filter(function (item) {
                return valueFilterFn(item.value);
            });
        },

        first: function (valueFilterFn) {
            var found = this.filter(valueFilterFn);
            return found.length > 0 ? found[0] : undefined;
        },

        length: function () { return this.items.length; },

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