var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../multivalue");
var Base64String = (function (_super) {
    __extends(Base64String, _super);
    function Base64String(value) {
        _super.call(this);
        this.value = value;
    }
    Object.defineProperty(Base64String, "typeName", {
        get: function () {
            return "base64";
        },
        enumerable: true,
        configurable: true
    });
    Base64String.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        return this.value === other.value;
    };
    Base64String.prototype.serialize = function () {
        return this.value;
    };
    Base64String.deserialize = function (str) {
        if (!str) {
            throw new Error("Cannot deserialize from empty string");
        }
        return new Base64String(str);
    };
    return Base64String;
})(multivalue.Multivalue);
module.exports = Base64String;
