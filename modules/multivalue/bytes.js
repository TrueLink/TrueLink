    "use strict";

    var Multivalue = require("./multivalue");

    function Bytes(arr) {
        this.value = arr;
    }

    function compareArrays(a, b) {
        if (a.length != b.length) return false;
        for (var i = 0; i < a.length; i++) 
        {
            if((a[i] & 0xFF) != (b[i] & 0xFF)) return false;
        }
        return true;        
    }

    var proto = {
        concat: function (otherBytes) {
            otherBytes = otherBytes.as(Bytes);
            return new Bytes(this.value.concat(otherBytes.value));
        },
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
            return compareArrays(this.value, other.value)
        },
        serialize: function () {
            throw new Error("Not implemented");
        }
    };

    Bytes.deserialize = function (obj) {
        throw new Error("Not implemented");
    };


    module.exports = Multivalue.createType(Bytes, "bytes", proto);
