// sjcl bitArray
define(["modules/data-types/multivalue", "modules/sjcl/bitArray"], function (createType, Ba) {
    "use strict";
    var BitArray = function (arr) {
        this.value = arr;
    };

    var mixin = {
        bitSlice: function (bstart, bend) {
            return new BitArray(Ba.bitSlice(this.value, bstart, bend));
        },
        bitLength: function () {
            return Ba.bitLength(this.value);
        },
        shiftRight: function (bits) {
            return new BitArray(Ba._shiftRight(this.value, bits));
        }
    };
    return createType(BitArray, "bitArray", mixin);
});