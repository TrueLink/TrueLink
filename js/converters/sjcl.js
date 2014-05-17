define(function (require, exports, module) {
    "use strict";
    var converter = require("multivalue/converter").getInstance();
    var codecBase64 = require("sjcl/codecBase64");
    var codecBytes = require("sjcl/codecBytes");
    var codecHex = require("sjcl/codecHex");
    var codecString = require("sjcl/codecString");
    var BigIntSjcl = require("sjcl/bn");
    var Base64 = require("multivalue/base64");
    var Base64Url = require("multivalue/base64url");
    var BitArray = require("multivalue/bitArray");
    var Hex = require("multivalue/hex");
    var Utf8String = require("multivalue/utf8string");
    var Bytes = require("multivalue/bytes");
    var Bn = require("multivalue/bigIntSjcl");

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
    });
    // just an array
    converter.register("bytes", "bitArray", function (value) {
        return new BitArray(codecBytes.toBits(value));
    });
    converter.register("bitArray", "bytes", function (value) {
        return new Bytes(codecBytes.fromBits(value));
    });


    converter.register("bigIntSjcl", "bitArray",function (value) {
        return new BitArray(value.toBits());
    });
    converter.register("bitArray", "bigIntSjcl",function (value) {
        return new Bn(BigIntSjcl.fromBits(value));
    });
    converter.register("bigIntSjcl", "hex", function (value) {
        return new Hex(value.toString().replace("0x", ""));
    });
    converter.register("hex", "bigIntSjcl", function (value) {
        return new Bn(value);
    });

});