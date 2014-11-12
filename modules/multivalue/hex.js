    "use strict";
    var Multivalue = require("./../Multivalue/multivalue");
    // 0x does not matter
    // always adds leading zero if string.length is odd
    function Hex(string) {
        if (string.length % 2) {
            string = "0" + string;
        }
        this.value = string.toUpperCase();
    }
    var proto = {
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
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
    module.exports = Multivalue.createType(Hex, "hex", proto);
