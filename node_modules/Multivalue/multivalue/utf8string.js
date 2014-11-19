var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../multivalue");
var Utf8String = (function (_super) {
    __extends(Utf8String, _super);
    function Utf8String(str) {
        _super.call(this);
        this.value = str;
    }
    Object.defineProperty(Utf8String, "typeName", {
        get: function () {
            return "utf8string";
        },
        enumerable: true,
        configurable: true
    });
    Utf8String.prototype.concat = function (otherBytes) {
        return new Utf8String(this.value.concat(otherBytes.as(Utf8String).value));
    };
    Utf8String.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        return this.value === other.value;
    };
    Utf8String.prototype.serialize = function () {
        return this.value;
    };
    Utf8String.prototype.toString = function () {
        return this.value;
    };
    Utf8String.deserialize = function (str) {
        return new Utf8String(str);
    };
    Utf8String.fromString = function (str) {
        return new Utf8String(str);
    };
    return Utf8String;
})(multivalue.Multivalue);
module.exports = Utf8String;
