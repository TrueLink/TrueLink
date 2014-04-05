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
        },
        expand: function (bitLength) {
            if (bitLength < 0 || bitLength % 4 != 0) { throw new Error('Invalid new length ' + bitLength); }
            if (this.value.length < 0 || this.value.length % 4 != 0) { throw new Error('Invalid old length ' + this.value.length); }
            var length = bitLength / 4;
            while (this.value.length < length) {
                this.value = "0" + this.value;
            }
            return this;
        }
    };

    Hex.deserialize = function (str) {
        if (!str) {
            throw new Error("Cannot deserialize from empty string");
        }
        return new Hex(str);
    };

    Hex.fromString = function (str) {
        if (!str) {
            throw new Error("Cannot create Hex from empty string");
        }
        return new Hex(str);
    };
    return createType(Hex, "hex", mixin);
});