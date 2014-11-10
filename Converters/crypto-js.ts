"use strict";
import modules = require("modules");
var converter_mod = modules.multivalue.converter;
var encUTF8 = modules.crypto_js.enc_utf8;
var encBase64 = modules.crypto_js.enc_base64;
var encHex = modules.crypto_js.enc_hex;
var X32WordArray = modules.multivalue.x32wordArray;
var Utf8String = modules.multivalue.utf8string;
var Base64 = modules.multivalue.base64;
var Hex = modules.multivalue.hex;

var converter = converter_mod.getInstance();

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

var _blank = { };
export = _blank;
