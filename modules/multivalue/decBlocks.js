define(function (require, exports, module) {
    "use strict";

    var Multivalue = require("./multivalue");

    var table = [
        [0, 3, 1, 7, 5, 9, 8, 6, 4, 2],
        [7, 0, 9, 2, 1, 5, 4, 8, 6, 3],
        [4, 2, 0, 6, 8, 7, 1, 3, 5, 9],
        [1, 7, 5, 0, 9, 8, 3, 4, 2, 6],
        [6, 1, 2, 3, 0, 4, 5, 9, 7, 8],
        [3, 6, 7, 4, 2, 0, 9, 5, 8, 1],
        [5, 8, 6, 9, 7, 2, 0, 1, 3, 4],
        [8, 9, 4, 5, 3, 6, 2, 0, 1, 7],
        [9, 4, 3, 8, 6, 1, 7, 2, 0, 5],
        [2, 5, 8, 1, 4, 3, 6, 7, 9, 0]
    ];
    function generateDamm(input) {
        var row = 0, i;
        for (i = 0; i < input.length; i++) {
            var col = input.charAt(i);
            row = table[row][col];
        }
        return row.toString();
    }
    function verifyDamm(input) {
        return generateDamm(input) === "0";
    }

    var DecBlocks = function (str) {
        this.value = str;
    };
    var mixin = {
        toString: function () {
            var full = this.value + generateDamm(this.value);
            return full.match(/.{1,4}/g).join("-");
        },
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
            return this.value == other.value
        },
    };
    var Fn = Multivalue.createType(DecBlocks, "decBlocks", mixin);
    Fn.fromString = function (string) {
        if (!string) {
            return null;
        }
        var numStr = string.replace(/\D/g, "");
        if (!verifyDamm(numStr)) {
            return null;
        }
        return new Fn(numStr.substring(0, numStr.length - 1));
    };
    return Fn;
    module.exports = Fn;
});