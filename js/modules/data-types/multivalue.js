define(["modules/converters/multiconverter", "zepto"], function (converter, $) {
    "use strict";

    var Multivalue = function () {};
    Multivalue.prototype = {
        as : function (target) {
            if (target.typeName === this.constructor.typeName) { return this; }
            return converter.convert(this.constructor.typeName, target.typeName, this.value);
        }
    };

    return function (type, name, mixin) {
        type.typeName = name;
        type.prototype = new Multivalue();
        if (mixin) {
            $.extend(type.prototype, mixin);
        }
        type.prototype.constructor = type;
        return type;
    };
});