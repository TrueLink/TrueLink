    "use strict";

    var Multivalue = require("./../Multivalue/multivalue");
    var forge = require("node-forge");
    var tools = require("../tools");

    function BigIntForge(value) {
        if(tools.isString(value)) {
            this.value = new forge.jsbn.BigInteger(value, 16);
        } else {
            this.value = value;
        }
    }

    var proto = {
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
            return (this.value.compareTo(other.value) === 0);
        },
        serialize: function () {
            throw new Error("Not implemented");
        }
    };

    BigIntForge.deserialize = function (obj) {
        throw new Error("Not implemented");
    };

    module.exports = Multivalue.createType(BigIntForge, "bigIntForge", proto);
