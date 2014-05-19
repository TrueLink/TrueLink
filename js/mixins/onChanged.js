define(function (require, exports, module) {
    "use strict";

    module.exports = {
        onChanged: function () { this.fire("changed", this); },
        set: function (name, value) {
            if (this[name] === value) { return; }
            this[name] = value;
            this.onChanged();
        },
        get: function (name) { return this[name]; }
    };
});