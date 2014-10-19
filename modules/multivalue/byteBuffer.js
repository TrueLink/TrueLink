define(function (require, exports, module) {
    "use strict";

    var Multivalue = require("./multivalue");
    var forge = require("../forge/forge");
    var tools = require("../tools");

    function ByteBuffer(value) {
        if(tools.isString(value) || tools.isArray(value) || forge.util.isArrayBufferView(value)) {
            this.value = new forge.util.ByteBuffer(value);
        } else {
            this.value = value.copy();
        }
    }

    var proto = {
        concat: function (other) {
            var result = this.value.copy();
            result.putBuffer(other.as(ByteBuffer).value.copy());
            return new ByteBuffer(result);
        },
        take: function (count) {
            if (count !== undefined) {
                count = count / 8;
            }
            return new ByteBuffer(this.value.getBytes(count));
        },
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
            return this.value.bytes() == other.value.bytes();
        },
        serialize: function () {
            throw new Error("Not implemented");
        }
    };

    ByteBuffer.deserialize = function (obj) {
        throw new Error("Not implemented");
    };

    module.exports = Multivalue.createType(ByteBuffer, "byteBuffer", proto);
});