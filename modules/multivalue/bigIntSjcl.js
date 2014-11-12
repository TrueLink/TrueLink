    "use strict";

    var Multivalue = require("./../Multivalue/multivalue");
    var Bn = require("../sjcl/bn");

    function BigIntSjcl(value) {
        if(value instanceof String || typeof value === "string") {
            this.value = new Bn(value);
        } else {
            this.value = value;
        }
    }

    var proto = {
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
            return this.value.equals(other.value);
        },
        serialize: function () {
            throw new Error("Not implemented");
        }
    };

    BigIntSjcl.deserialize = function (obj) {
        throw new Error("Not implemented");
    };


    module.exports = Multivalue.createType(BigIntSjcl, "bigIntSjcl", proto);
