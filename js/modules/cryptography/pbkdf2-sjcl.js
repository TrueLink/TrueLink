define([
    "modules/sjcl/pbkdf2",
    "modules/converters/sjcl",
    "modules/data-types/bitArray"
], function (pbkdf2, sj, BitArray) {
    "use strict";

    return function (password, salt){
        password = password.as(BitArray).value;
        salt = salt.as(BitArray).value;

        var result = pbkdf2(password, salt);
        return new BitArray(result);
    }
});