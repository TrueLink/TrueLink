define(["zepto"], function ($) {
    "use strict";

    app.factory("RepoItem", function () {

        function RepoItem() {
            this._cachedFields = {};
        }

        RepoItem.prototype = {
            getCacheParams: function () {
                return {};
            },
            getId: function () {
                return this.entity.id;
            },
            getData: function (key) {
                var cache = this.getCacheParams();
                if (cache.hasOwnProperty(key)) {
                    if (!this._cachedFields.hasOwnProperty(key)) {
                        this._cachedFields[key] = cache[key].load(this.entity.getData(key));
                    }
                    return this._cachedFields[key];
                }
                return this.entity.getData(key);
            },
            setData: function (keyOrValue, value) {
                var cache = this.getCacheParams();
                if (value !== undefined && cache.hasOwnProperty(keyOrValue)) {
                    var key = keyOrValue;
                    this._cachedFields[key] = cache[key].set ? cache[key].set(value) : value;
                    this.entity.setData(key, cache[key].save(value));
                    return;
                }
                return this.entity.setData(keyOrValue, value);
            },
            isNew: function () { return this.entity.isNew(); }
        };
        return RepoItem;
    });
});