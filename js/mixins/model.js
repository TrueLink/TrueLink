define(function (require, exports, module) {
    "use strict";

    var invariant = require("modules/invariant");

    module.exports = {
        isModel: true,
        _onChanged: function () { this.fire("changed", this); },
        set: function (obj) {
            invariant(typeof obj === "object", "obj must be object");
            for (var key in obj) {
                if(obj.hasOwnProperty(key)) {
                    this[key] = obj[key];
                }
            }
            this._onChanged();
        },
        //get: function (name) { return this[name]; },
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