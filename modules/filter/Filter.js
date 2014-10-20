    "use strict";
    var eventEmitter = require("../events/eventEmitter");

    var tools = require("../tools");
    var extend = tools.extend;

    function Filter() {
        this._defineEvent("filtered");
        this._defineEvent("unfiltered");
    }

    extend(Filter.prototype, eventEmitter, {
        filter: function (value) {
            var filtered = this._filter(value);
            if (filtered) { this.fire("filtered", filtered); }
        },
        _filter: function (value) { return value; },
        unfilter: function (value) {
            this.fire("unfiltered", this._unfilter(value));
        },
        _unfilter: function (value) {
            return value;
        }
    });

    module.exports = Filter;
