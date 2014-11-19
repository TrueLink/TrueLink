"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var multivalue = require("../multivalue");
var forge = require("node-forge");
var tools = require("../tools");
var BigIntForge = (function (_super) {
    __extends(BigIntForge, _super);
    function BigIntForge(value) {
        _super.call(this);
        if (tools.isString(value)) {
            this.value = new forge.jsbn.BigInteger(value, 16);
        }
        else {
            this.value = value;
        }
    }
    Object.defineProperty(BigIntForge, "typeName", {
        get: function () {
            return "bigIntForge";
        },
        enumerable: true,
        configurable: true
    });
    BigIntForge.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        return (this.value.compareTo(other.value) === 0);
    };
    BigIntForge.prototype.serialize = function () {
        throw new Error("Not implemented");
    };
    BigIntForge.deserialize = function (str) {
        throw new Error("Not implemented");
    };
    return BigIntForge;
})(multivalue.Multivalue);
;
module.exports = BigIntForge;
