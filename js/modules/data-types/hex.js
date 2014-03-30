define(["modules/data-types/multivalue"], function (createType) {
    "use strict";
    // 0x does not matter
    var Hex = function (string) {
        this.value = string.toUpperCase();
    };
    var mixin = {
        isEqualTo: function (other) {
            if (this.constructor.typeName !== other.constructor.typeName) { return false; }
            var thisStr = this.value.toUpperCase().replace(/^0+/, "");
            var thatStr = other.value.toUpperCase().replace(/^0+/, "");
            return thisStr === thatStr;
        },
        toString: function () {
            return this.value;
        },
        serialize: function () {
            return this.value;
        }
    };

    Hex.deserialize = function (str) {
        return str ? new Hex(str) : null;
    };
    return createType(Hex, "hex", mixin);
});