define(["modules/data-types/multivalue"], function (createType) {
    "use strict";
    var Utf8String = function (string) {
        this.value = string;
    };
    var mixin = {
        isEqualTo: function (other) {
            if (this.constructor.typeName !== other.constructor.typeName) { return false; }
            return this.value === other.value;
        },
        toString: function () {
            return this.value;
        }
    };

    Utf8String.fromString = function (str) {
        return new Utf8String(str);
    };

    return createType(Utf8String, "utf8string");
});