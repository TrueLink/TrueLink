define(function (require, exports, module) {
    "use strict";

    var Multivalue = require("./multivalue");
    var WordArray = require("../crypto-js/x32wordArray");

    function X32WordArray(value, sigBytes) {
        if (value instanceof Array) {
            this.value = WordArray.create(value, sigBytes);
        } else {
            this.value = value;
        }
    }

    function compareArrays(a, b) {
        if (a.length != b.length) return false;
        for (var i = 0; i < a.length; i++) 
        {
            if((a[i] & 0xFFFFFFFF) != (b[i] & 0xFFFFFFFF)) return false;
        }
        return true;        
    }

    var proto = {
        concat: function (otherBytes) {
            otherBytes = otherBytes.as(X32WordArray);
            return new X32WordArray(this.value.concat(otherBytes.value));
        },
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
            if (this.value.sigBytes != other.value.sigBytes) return false;
            return compareArrays(this.value.words, other.value.words)
        },
        serialize: function () {
            throw new Error("Not implemented");
        }
    };

    X32WordArray.deserialize = function (obj) {
        throw new Error("not implemented");
    };


    module.exports = Multivalue.createType(X32WordArray, "x32wordArray", proto);
});