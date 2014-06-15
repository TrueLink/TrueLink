define(function (require, exports, module) {
    "use strict";
    var converter = require("modules/multivalue/converter").getInstance();
    var codecBase64 = require("modules/sjcl/codecBase64");
    var codecBytes = require("modules/sjcl/codecBytes");
    var codecHex = require("modules/sjcl/codecHex");
    var codecString = require("modules/sjcl/codecString");
    var Bn = require("modules/sjcl/bn");
    var Base64 = require("modules/multivalue/base64");
    var Base64Url = require("modules/multivalue/base64url");
    var BitArray = require("modules/multivalue/bitArray");
    var Hex = require("modules/multivalue/hex");
    var Utf8String = require("modules/multivalue/utf8string");
    var Bytes = require("modules/multivalue/bytes");
    var BigIntSjcl = require("modules/multivalue/bigIntSjcl");

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
        return new BigIntSjcl(Bn.fromBits(value));
    });
    converter.register("bigIntSjcl", "hex", function (value) {
        return new Hex(value.toString().replace("0x", ""));
    });
    converter.register("hex", "bigIntSjcl", function (value) {
        return new BigIntSjcl(new Bn(value));
    });

});