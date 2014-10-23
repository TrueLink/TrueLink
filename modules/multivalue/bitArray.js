    "use strict";

    var Multivalue = require("./multivalue");
    var Ba = require("../sjcl/bitArray");

    function BitArray(arr) {
        this.value = arr;
    }

    var proto = {
        bitSlice: function (bstart, bend) {
            return new BitArray(Ba.bitSlice(this.value, bstart, bend));
        },
        bitLength: function () {
            return Ba.bitLength(this.value);
        },
        shiftRight: function (bits) {
            if (typeof bits !== "number" || bits <= 0) {
                throw new Error("bits must be number greater than 0");
            }
            return new BitArray(Ba._shiftRight(this.value, bits));
        },
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
            return Ba.equal(this.value, other.value);
        },
        serialize: function () {
            throw new Error("Not implemented");
        }
    };

    BitArray.deserialize = function (obj) {
        throw new Error("Not implemented");
    };


    module.exports = Multivalue.createType(BitArray, "bitArray", proto);
