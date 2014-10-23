
    "use strict";
    var Converter = require("./converter");

    function extend(dst, src) {
        var key;
        for (key in src) {
            if (src[key] !== undefined) {
                dst[key] = src[key];
            }
        }
    }

    function Multivalue() {  }

    Multivalue.createType = function (type, name, mixin) {
        type.typeName = name;
        type.prototype = new Multivalue();
        if (mixin) {
            extend(type.prototype, mixin);
        }
        type.prototype.constructor = type;
        type.prototype.super = Multivalue.prototype;
        return type;
    };

    extend(Multivalue.prototype, {
        isEqualTo: function(other) {
            if (!(other instanceof Multivalue)) {
                throw new Error("Cannot compare to non-multivalue");
            }
            if (this.constructor.typeName !== other.constructor.typeName) { 
                throw new Error("Cannot compare " + this.constructor.typeName + " to " + other.constructor.typeName);
            }
            return true;
        },
        as: function (target) {
            if (!target || !(target.prototype instanceof Multivalue)) {
                throw new Error("Cannot convert to non-multivalue");
            }
            var converter = Converter.getInstance();
            if (target.typeName === this.constructor.typeName) { 
                return new target(this.value); 
            }
            return converter.convert(this.constructor.typeName, target.typeName, this.value);
        }
    });

    module.exports = Multivalue;
