var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../multivalue");
var sjcl = require("sjcl-all");
var BigIntSjcl = (function (_super) {
    __extends(BigIntSjcl, _super);
    function BigIntSjcl(value) {
        _super.call(this);
        if (!(value instanceof sjcl.bn)) {
            value = new sjcl.bn(value);
        }
        this.value = value;
    }
    Object.defineProperty(BigIntSjcl, "typeName", {
        get: function () {
            return "bigIntSjcl";
        },
        enumerable: true,
        configurable: true
    });
    BigIntSjcl.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        return this.value.equals(other.value);
    };
    BigIntSjcl.deserialize = function (obj) {
        throw new Error("Not implemented");
    };
    return BigIntSjcl;
})(multivalue.Multivalue);
module.exports = BigIntSjcl;
