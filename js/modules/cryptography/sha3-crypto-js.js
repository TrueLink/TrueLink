define(["modules/crypto-js/sha3-helper", "modules/converters/crypto-js", "modules/data-types/x32wordArray"], function (hashFn, cjs, WordArray) {
    "use strict";
    var SHA3 = function (value, outputLength) {
        var arr = value.as(WordArray);
        var hash = hashFn(arr.value, { outputLength: outputLength || 512 });
        return new WordArray(hash);
    };

    return SHA3;
});