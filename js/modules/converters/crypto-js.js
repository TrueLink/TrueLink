define([
    "modules/converters/multiconverter",
    "modules/crypto-js/enc-utf8",
    "modules/crypto-js/enc-base64",
    "modules/crypto-js/enc-hex",
    "modules/data-types/x32wordArray",
    "modules/data-types/utf8string",
    "modules/data-types/base64",
    "modules/data-types/hex"
],
    function (converter, encUTF8, encBase64, encHex, X32WordArray, Utf8String, Base64, Hex) {
        "use strict";
        converter.register("utf8string", "x32wordArray", function (value) {
            return new X32WordArray(encUTF8.parse(value));
        });
        converter.register("x32wordArray", "utf8string", function (value) {
            return new Utf8String(encUTF8.stringify(value));
        }, true);
        converter.register("base64", "x32wordArray", function (value) {
            return new X32WordArray(encBase64.parse(value));
        });
        converter.register("x32wordArray", "base64", function (value) {
            return new Base64(encBase64.stringify(value));
        });
        converter.register("hex", "x32wordArray", function (value) {
            return new X32WordArray(encHex.parse(value));
        });
        converter.register("x32wordArray", "hex", function (value) {
            return new Hex(encHex.stringify(value));
        });

});