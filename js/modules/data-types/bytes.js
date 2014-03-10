define(["modules/data-types/multivalue"], function (createType) {
    "use strict";
    var Bytes = function (arr) {
        this.value = arr;
    };
    var mixin = {
        concat: function (otherBytes) {
            otherBytes = otherBytes.as(Bytes);
            return new Bytes(this.value.concat(otherBytes.value));
        }
    };
    return createType(Bytes, "bytes", mixin);
});