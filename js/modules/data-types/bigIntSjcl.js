define(["modules/data-types/multivalue", "modules/sjcl/bn"], function (createType, Bn) {
    "use strict";
    var BigIntSjcl = function (obj) {
        this.value = new Bn(obj);
    };
    BigIntSjcl.random = Bn.random;
    return createType(BigIntSjcl, "bigIntSjcl");
});