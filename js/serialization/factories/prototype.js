define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var model = require("mixins/model");

    module.exports = {
        _observed: function (obj) {
            invariant(this.serializer, "serializer is not defined");
            // todo this is kinda strange
            if (!obj.isModel) {
                extend(obj.constructor.prototype, model);
            }
            this.serializer.listen(obj);
            return obj;
        },

        contsruct: function (Constructor) {
            return this._observed(new Constructor(this));
        }
    };
});