var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../index");
var sjcl = require("sjcl-all");
var BitArray = (function (_super) {
    __extends(BitArray, _super);
    function BitArray(arr) {
        _super.call(this);
        this.value = arr;
    }
    Object.defineProperty(BitArray, "typeName", {
        get: function () {
            return "bitArray";
        },
        enumerable: true,
        configurable: true
    });
    BitArray.prototype.bitSlice = function (bstart, bend) {
        return new BitArray(sjcl.bitArray.bitSlice(this.value, bstart, bend));
    };
    BitArray.prototype.bitLength = function () {
        return sjcl.bitArray.bitLength(this.value);
    };
    BitArray.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        return sjcl.bitArray.equal(this.value, other.value);
    };
    BitArray.prototype.shiftRight = function (bits) {
        if (bits <= 0) {
            throw new Error("bits must be greater than 0");
        }
        return new BitArray(sjcl.bitArray._shiftRight(this.value, bits));
    };
    return BitArray;
})(multivalue.Multivalue);
module.exports = BitArray;
