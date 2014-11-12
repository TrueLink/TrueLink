var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../index");
var Base64StringUrl = (function (_super) {
    __extends(Base64StringUrl, _super);
    function Base64StringUrl(value) {
        _super.call(this);
        this.value = value;
    }
    Object.defineProperty(Base64StringUrl, "typeName", {
        get: function () {
            return "base64url";
        },
        enumerable: true,
        configurable: true
    });
    Base64StringUrl.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        return this.value === other.value;
    };
    Base64StringUrl.prototype.serialize = function () {
        return this.value;
    };
    Base64StringUrl.deserialize = function (str) {
        if (!str) {
            throw new Error("Cannot deserialize from empty string");
        }
        return new Base64StringUrl(str);
    };
    return Base64StringUrl;
})(multivalue.Multivalue);
module.exports = Base64StringUrl;
