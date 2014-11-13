var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../index");
var cryptojs = require("../../modules/crypto-js");
function compareArrays(a, b) {
    if (a.length != b.length)
        return false;
    for (var i = 0; i < a.length; i++) {
        if ((a[i] & 0xFFFFFFFF) != (b[i] & 0xFFFFFFFF))
            return false;
    }
    return true;
}
var X32WordArray = (function (_super) {
    __extends(X32WordArray, _super);
    function X32WordArray(value, sigBytes) {
        _super.call(this);
        if (value instanceof Array) {
            this.value = cryptojs.lib.WordArray.create(value, sigBytes);
        }
        else {
            this.value = value;
        }
    }
    Object.defineProperty(X32WordArray, "typeName", {
        get: function () {
            return "x32wordArray";
        },
        enumerable: true,
        configurable: true
    });
    X32WordArray.prototype.concat = function (otherBytes) {
        return new X32WordArray(this.value.concat(otherBytes.as(X32WordArray).value));
    };
    X32WordArray.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        if (this.value.sigBytes != other.value.sigBytes)
            return false;
        return compareArrays(this.value.words, other.value.words);
    };
    X32WordArray.deserialize = function (obj) {
        throw new Error("not implemented");
    };
    return X32WordArray;
})(multivalue.Multivalue);
module.exports = X32WordArray;
