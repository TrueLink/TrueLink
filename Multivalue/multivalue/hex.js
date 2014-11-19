var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../multivalue");
var Hex = (function (_super) {
    __extends(Hex, _super);
    function Hex(value) {
        _super.call(this);
        if (value.length % 2 !== 0) {
            value = "0" + value;
        }
        this.value = value.toUpperCase();
    }
    Object.defineProperty(Hex, "typeName", {
        get: function () {
            return "hex";
        },
        enumerable: true,
        configurable: true
    });
    Hex.prototype.toString = function () {
        return this.value;
    };
    Hex.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        var thisStr = this.value.toUpperCase().replace(/^0+/, "");
        var thatStr = other.value.toUpperCase().replace(/^0+/, "");
        return thisStr === thatStr;
    };
    Hex.prototype.serialize = function () {
        return this.value;
    };
    Hex.fromString = function (str) {
        if (!str) {
            throw new Error("Cannot create Hex from empty string");
        }
        return new Hex(str);
    };
    Hex.deserialize = function (str) {
        if (!str) {
            throw new Error("Cannot deserialize from empty string");
        }
        return new Hex(str);
    };
    return Hex;
})(multivalue.Multivalue);
module.exports = Hex;
