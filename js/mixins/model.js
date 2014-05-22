define(function (require, exports, module) {
    "use strict";

    module.exports = {
        onChanged: function () { this.fire("changed", this); },
        set: function (name, value) {
            if (typeof name === "object") {
                for (var key in name) {
                    if(name.hasOwnProperty(key)) {
                        this[key] = name[key];
                    }
                }
            } else {
                if (this[name] === value) { return; }
                this[name] = value;
            }
            this.onChanged();
        },
        get: function (name) { return this[name]; },
        serializationNeeded: function () {
            return !this.getMeta() || !this.getMeta().id;
        }
    };
});