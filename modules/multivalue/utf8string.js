    "use strict";

    var Multivalue = require("./multivalue");

    function Utf8String(str) {
        this.value = str;
    }

    var proto = {
        concat: function (otherBytes) {
            otherBytes = otherBytes.as(Utf8String);
            return new Utf8String(this.value.concat(otherBytes.value));
        },
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
            return this.value === other.value;
        },
        serialize: function () {
            return this.value;
        },
        toString: function () {
            return this.value;
        }
    };

    Utf8String.deserialize = function (str) {
        return new Utf8String(str);
    };

    Utf8String.fromString = function (str) {
        return new Utf8String(str);
    };


    module.exports = Multivalue.createType(Utf8String, "utf8string", proto);