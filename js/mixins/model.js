define(function (require, exports, module) {
    "use strict";

    var invariant = require("modules/invariant");

    module.exports = {
        isModel: true,
        _onChanged: function () { this.fire("changed", this); },
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
            this._onChanged();
        },
        get: function (name) { return this[name]; },
        serializationNeeded: function () {
            return !this.getMeta() || !this.getMeta().id;
        },
        setFactory: function (factory) {
            this._factory = factory;
        },
        checkFactory: function () {
            invariant(this._factory, "factory is not set");
        }
    };
});