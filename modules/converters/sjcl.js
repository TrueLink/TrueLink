"use strict";
var modules = require("../index");
var converter_mod = modules.multivalue.converter;
var codecBase64 = modules.sjcl.codecBase64;
var codecBytes = modules.sjcl.codecBytes;
var codecHex = modules.sjcl.codecHex;
var codecString = modules.sjcl.codecString;
var Bn = modules.sjcl.bn;
var Ba = modules.sjcl.bitArray;
var Base64 = modules.multivalue.base64;
var Base64Url = modules.multivalue.base64url;
var BitArray = modules.multivalue.bitArray;
var Hex = modules.multivalue.hex;
var Utf8String = modules.multivalue.utf8string;
var X32WordArray = modules.multivalue.x32wordArray;
var Bytes = modules.multivalue.bytes;
var BigIntSjcl = modules.multivalue.bigIntSjcl;
var converter = converter_mod.getInstance();
converter.register("x32wordArray", "bitArray", function (value) {
    return new BitArray(value.words);
});
converter.register("bitArray", "x32wordArray", function (value) {
    return new X32WordArray(value, Ba.bitLength(value) / 8);
});
converter.register("base64", "bitArray", function (value) {
    return new BitArray(codecBase64.toBits(value));
});
converter.register("bitArray", "base64", function (value) {
    return new Base64(codecBase64.fromBits(value));
});
converter.register("base64url", "bitArray", function (value) {
    return new BitArray(codecBase64.toBits(value, 1));
});
converter.register("bitArray", "base64url", function (value) {
    return new Base64Url(codecBase64.fromBits(value, 1, 1));
});
converter.register("hex", "bitArray", function (value) {
    return new BitArray(codecHex.toBits(value));
});
converter.register("bitArray", "hex", function (value) {
    return new Hex(codecHex.fromBits(value));
});
converter.register("utf8string", "bitArray", function (value) {
    return new BitArray(codecString.toBits(value));
});
converter.register("bitArray", "utf8string", function (value) {
    return new Utf8String(codecString.fromBits(value));
}, true);
// just an array
converter.register("bytes", "bitArray", function (value) {
    return new BitArray(codecBytes.toBits(value));
});
converter.register("bitArray", "bytes", function (value) {
    return new Bytes(codecBytes.fromBits(value));
});
converter.register("bigIntSjcl", "bitArray", function (value) {
    return new BitArray(value.toBits());
});
converter.register("bitArray", "bigIntSjcl", function (value) {
    return new BigIntSjcl(Bn.fromBits(value));
}, true);
converter.register("bigIntSjcl", "hex", function (value) {
    return new Hex(value.toString().replace("0x", ""));
});
converter.register("hex", "bigIntSjcl", function (value) {
    return new BigIntSjcl(new Bn(value));
}, true);
function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
converter.register("base64", "base64url", function (value) {
    var result = replaceAll(value, "+", "-");
    result = replaceAll(result, "/", "_");
    result = replaceAll(result, "=", "");
    return new Base64Url(result);
});
converter.register("base64url", "base64", function (value) {
    var result = replaceAll(value, "-", "+");
    result = replaceAll(result, "_", "/");
    while (result.length & 3) {
        result += "=";
    }
    return new Base64(result);
});
var _blank = {};
module.exports = _blank;
