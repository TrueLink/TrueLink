    "use strict";
    import converter_mod = require("../../modules/multivalue/converter");
    import codecBase64 = require("../../modules/sjcl/codecBase64");
    import codecBytes = require("../../modules/sjcl/codecBytes");
    import codecHex = require("../../modules/sjcl/codecHex");
    import codecString = require("../../modules/sjcl/codecString");
    import Bn = require("../../modules/sjcl/bn");
    import Ba = require("../../modules/sjcl/bitArray");
    import Base64 = require("../../modules/multivalue/base64");
    import Base64Url = require("../../modules/multivalue/base64url");
    import BitArray = require("../../modules/multivalue/bitArray");
    import Hex = require("../../modules/multivalue/hex");
    import Utf8String = require("../../modules/multivalue/utf8string");
    import X32WordArray = require("../../modules/multivalue/x32wordArray");
    import Bytes = require("../../modules/multivalue/bytes");
    import BigIntSjcl = require("../../modules/multivalue/bigIntSjcl");
    var converter = converter_mod.getInstance();

    converter.register("x32wordArray", "bitArray", function(value) {
        return new BitArray(value.words);
    });
    converter.register("bitArray", "x32wordArray", function(value) {
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


    converter.register("bigIntSjcl", "bitArray",function (value) {
        return new BitArray(value.toBits());
    });
    converter.register("bitArray", "bigIntSjcl",function (value) {
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

    var _blank = { };
    export = _blank;
