define([
    "modules/converters/multiconverter",
    "modules/data-types/decBlocks",
    "modules/data-types/hex",
    "modules/leemon/BigInt"
],
    function (converter, DecBlocks, Hex, leemon) {
        "use strict";
        converter.register("hex", "decBlocks", function (value) {
            var bi = leemon.str2bigInt(value, 16);
            return new DecBlocks(leemon.bigInt2str(bi, 10));
        });
        converter.register("decBlocks", "hex", function (value) {
            var bi = leemon.str2bigInt(value, 10);
            var hex = new Hex(leemon.bigInt2str(bi, 16));
            if (value.minBitLength) {
                hex.expand(value.minBitLength);
            }
            return hex;
        });
    });