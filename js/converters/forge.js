define(function (require, exports, module) {
    "use strict";
    var converter = require("modules/multivalue/converter").getInstance();
    var BigIntForge = require("modules/multivalue/bigIntForge");
    var Hex = require("modules/multivalue/hex");
    var Bytes = require("modules/multivalue/bytes");

    var forge = require("modules/forge/forge")();

    converter.register("bigIntForge", "hex", function (value) {
        return new Hex(value.toString(16));
    });

    converter.register("hex", "bigIntForge", function (value) {
        return new BigIntForge(new forge.jsbn.BigInteger(value, 16));
    });

    converter.register("bigIntForge", "bytes", function (value) {
        return new Bytes(value.toByteArray());
    });

});