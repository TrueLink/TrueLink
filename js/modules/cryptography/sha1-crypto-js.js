define(["modules/crypto-js/sha1-helper", "modules/converters/crypto-js", "modules/data-types/x32wordArray"], function (hashFn, cjs, WordArray) {
    "use strict";
    var SHA1 = function (value) {
        var arr = value.as(WordArray);
        var hash = hashFn(arr.value);
        return new WordArray(hash);
    };

    return SHA1;
});