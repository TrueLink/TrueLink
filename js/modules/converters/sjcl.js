// base64, bitArray, base64url, hex, bytes, BigIntSjcl
define([
    "modules/converters/multiconverter",
    "modules/sjcl/codecBase64",
    "modules/sjcl/codecBytes",
    "modules/sjcl/codecHex",
    "modules/sjcl/codecString",
    "modules/sjcl/bn",
    "modules/data-types/base64",
    "modules/data-types/base64url",
    "modules/data-types/bitArray",
    "modules/data-types/hex",
    "modules/data-types/utf8string",
    "modules/data-types/bytes",
    "modules/data-types/bigIntSjcl"
],
    function (converter, codecBase64, codecBytes, codecHex, codecString, BigIntSjcl,
              Base64, Base64Url, BitArray, Hex, Utf8String, Bytes, Bn) {
        "use strict";
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