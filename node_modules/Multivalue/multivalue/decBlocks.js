var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../index");
var DecBlocks = (function (_super) {
    __extends(DecBlocks, _super);
    function DecBlocks(str) {
        _super.call(this);
        this.value = str;
    }
    Object.defineProperty(DecBlocks, "typeName", {
        get: function () {
            return "decBlocks";
        },
        enumerable: true,
        configurable: true
    });
    DecBlocks.generateDamm = function (input) {
        var row = 0;
        for (var i = 0; i < input.length; i++) {
            var col = input.charCodeAt(i);
            row = this.table[row][col];
        }
        return row.toString();
    };
    DecBlocks.verifyDamm = function (input) {
        return this.generateDamm(input) === "0";
    };
    DecBlocks.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        return this.value == other.value;
    };
    DecBlocks.prototype.toString = function () {
        var full = this.value + DecBlocks.generateDamm(this.value);
        return full.match(/.{1,4}/g).join("-");
    };
    DecBlocks.fromString = function (str) {
        if (!str) {
            return null;
        }
        var numStr = str.replace(/\D/g, "");
        if (!this.verifyDamm(numStr)) {
            return null;
        }
        return new this(numStr.substring(0, numStr.length - 1));
    };
    DecBlocks.table = [
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
    return DecBlocks;
})(multivalue.Multivalue);
module.exports = DecBlocks;
