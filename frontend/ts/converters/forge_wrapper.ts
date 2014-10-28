/// <reference path="../../node_modules/forge-typescript-definitions/forge/forge.d.ts"/>
    "use strict";
    import modules = require("modules");
    var converter_mod = modules.multivalue.converter;
    var BigIntForge = modules.multivalue.bigIntForge;
    var Hex = modules.multivalue.hex;
    var Base64 = modules.multivalue.base64;
    var Bytes = modules.multivalue.bytes;
    var DecBlocks = modules.multivalue.decBlocks;
    var BigIntSjcl = modules.multivalue.bigIntSjcl;
    var ByteBuffer = modules.multivalue.byteBuffer;
    var Utf8String = modules.multivalue.utf8string;

    import forge = require("forge");
    var converter = converter_mod.getInstance();

    converter.register("bigIntForge", "hex", function (value) {
        return new Hex(value.toString(16));
    });

    converter.register("hex", "bigIntForge", function (value) {
        return new BigIntForge(value);
    }, true);

    converter.register("bigIntForge", "bytes", function (value) {
        return new Bytes(value.toByteArray().map(function (n) { return n & 0xFF; }));
    });

    converter.register("bytes", "bigIntForge", function (value) {
        return new BigIntForge(new forge.jsbn.BigInteger(value, 256));
    }, true);

    converter.register("bigIntForge", "decBlocks", function (value) {
        return new DecBlocks(value.toString(10));
    });

    converter.register("decBlocks", "bigIntForge", function (value) {
        return new BigIntForge(new forge.jsbn.BigInteger(value, 10));
    }, true);

    converter.register("bigIntSjcl", "bigIntForge", function (value) {
        return new BigIntForge(value.toString().replace("0x", ""));
    }, true);

    converter.register("bigIntForge", "bigIntSjcl", function (value) {
        return new BigIntSjcl(value.toString(16));
    });

    /// _______________________________________________________________________

    converter.register("byteBuffer", "hex", function (value) {
        return new Hex(forge.util.binary.hex.encode(value));
    });

    converter.register("hex", "byteBuffer", function (value) {
        return new ByteBuffer(forge.util.binary.hex.decode(value));
    });

    converter.register("byteBuffer", "base64", function (value) {
        return new Base64(forge.util.encode64(value.bytes()));
    });

    converter.register("base64", "byteBuffer", function (value) {
        return new ByteBuffer(forge.util.decode64(value));
    });

    converter.register("byteBuffer", "utf8string", function (value) {
        return new Utf8String(forge.util.decodeUtf8(value.bytes()));
    });

    converter.register("utf8string", "byteBuffer", function (value) {
        return new ByteBuffer(forge.util.encodeUtf8(value));
    });
    var _blank = { };
    export = _blank;
