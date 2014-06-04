define(function (require, exports, module) {
    "use strict";
    var converter = require("modules/multivalue/converter").getInstance();
    var DecBlocks = require("modules/multivalue/decBlocks");
    var Hex = require("modules/multivalue/hex");
    var leemon = require("modules/leemon/BigInt");

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