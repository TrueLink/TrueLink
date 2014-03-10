define(["modules/data-types/multivalue"], function (createType) {
    "use strict";
    // 0x does not matter
    var Hex = function (string) {
        this.value = string.toUpperCase();
    };
    var mixin = {
        isEqualTo: function (other) {
            var thisStr = this.value.toUpperCase().replace(/^0+/, "");
            var thatStr = other.value.toUpperCase().replace(/^0+/, "");
            return thisStr === thatStr;
        }
    };
    return createType(Hex, "hex", mixin);
});