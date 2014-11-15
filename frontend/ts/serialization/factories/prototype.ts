    "use strict";
    import modules = require("modules");
    import invariant = require("invariant");
    import extend = require("../../tools/extend");
    import model = require("../../mixins/model");
    var tools = modules.tools;

    var exp = {
        singletons: {},
        _observed: function (obj) {
            invariant(this.serializer, "serializer is not defined");
            // todo this is kinda strange
            if (!obj.isModel) {
                extend(obj.constructor.prototype, model);
            }
            this.serializer.listen(obj);
            return obj;
        },
        getInstance: function (name, constructor, thisArg) {
            if (!this.singletons[name]) {
                if (!tools.isFunction(constructor)) {
                    throw new Error("No " + name + " instance created yet");
                }
                this.singletons[name] = constructor.call(thisArg);
            }
            return this.singletons[name];
        }
    };
export = exp;
