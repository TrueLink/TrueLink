    "use strict";

    import invariant = require("modules/invariant");

    var exp = {
        isModel: true,
        // use from ui:
        set: function (obj, newVal) {
            if (typeof obj === "string" && newVal !== undefined) {
                var key = obj;
                if (this[key] !== newVal) {
                    this[key] = newVal;
                    this._onChanged();
                }
                return;
            }
            invariant(typeof obj === "object", "obj must be key => value");
            var changed = false;
            for (var key in obj) {
                if(obj.hasOwnProperty(key) && this[key] !== obj[key]) {
                    this[key] = obj[key];
                    changed = true;
                }
            }
            if (changed) { this._onChanged(); }
        },
        _onChanged: function () {
            this.fire("changed", this);
        },
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
export = exp;
