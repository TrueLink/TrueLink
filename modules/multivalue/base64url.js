    "use strict";

    var Multivalue = require("./multivalue");

    function Base64StringUrl(string) {
        this.value = string;
    }

    var proto = {
        isEqualTo: function (other) {
            if(!this.super.isEqualTo.call(this, other)) {
                return false;
            }
            return this.value == other.value;
        },
        serialize: function () {
            return this.value;
        }
    };

    Base64StringUrl.deserialize = function (str) {
        if (!str) {
            throw new Error("Cannot deserialize from empty string");
        }
        return new Base64StringUrl(str);
    };


    module.exports = Multivalue.createType(Base64StringUrl, "base64url", proto);
