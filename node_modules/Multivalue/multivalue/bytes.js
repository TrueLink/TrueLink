var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../index");
function compareArrays(a, b) {
    if (a.length != b.length)
        return false;
    for (var i = 0; i < a.length; i++) {
        if ((a[i] & 0xFF) != (b[i] & 0xFF))
            return false;
    }
    return true;
}
var Bytes = (function (_super) {
    __extends(Bytes, _super);
    function Bytes(arr) {
        _super.call(this);
        this.value = arr;
    }
    Object.defineProperty(Bytes, "typeName", {
        get: function () {
            return "bytes";
        },
        enumerable: true,
        configurable: true
    });
    Bytes.prototype.concat = function (otherBytes) {
        return new Bytes(this.value.concat(otherBytes.as(Bytes).value));
    };
    Bytes.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        return compareArrays(this.value, other.value);
    };
    Bytes.deserialize = function (obj) {
        throw new Error("Not implemented");
    };
    return Bytes;
})(multivalue.Multivalue);
module.exports = Bytes;
