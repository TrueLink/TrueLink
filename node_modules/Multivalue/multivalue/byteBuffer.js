"use strict";
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var forge = require("node-forge");
var multivalue = require("../multivalue");
var tools = require("../tools");
var ByteBuffer = (function (_super) {
    __extends(ByteBuffer, _super);
    function ByteBuffer(value) {
        _super.call(this);
        if (tools.isString(value) || tools.isArray(value) || forge.util.isArrayBufferView(value)) {
            this.value = new forge.util.ByteBuffer(value);
        }
        else {
            this.value = value.copy();
        }
    }
    Object.defineProperty(ByteBuffer, "typeName", {
        get: function () {
            return "byteBuffer";
        },
        enumerable: true,
        configurable: true
    });
    ByteBuffer.prototype.concat = function (other) {
        var result = this.value.copy();
        result.putBuffer(other.as(ByteBuffer).value.copy());
        return new ByteBuffer(result);
    };
    ByteBuffer.prototype.take = function (count) {
        if (count !== undefined) {
            count = count / 8;
        }
        return new ByteBuffer(this.value.getBytes(count));
    };
    ByteBuffer.prototype.isEqualTo = function (other) {
        if (!_super.prototype.isEqualTo.call(this, other)) {
            return false;
        }
        return this.value.bytes() == other.value.bytes();
    };
    ByteBuffer.prototype.serialize = function () {
        throw new Error("Not implemented");
    };
    ByteBuffer.deserialize = function (str) {
        throw new Error("Not implemented");
    };
    return ByteBuffer;
})(multivalue.Multivalue);
;
module.exports = ByteBuffer;
