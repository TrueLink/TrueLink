    "use strict";
    import converter_mod = require("../modules/multivalue/converter");
    import encUTF8 = require("../modules/crypto-js/enc-utf8");
    import encBase64 = require("../modules/crypto-js/enc-base64");
    import encHex = require("../modules/crypto-js/enc-hex");
    import X32WordArray = require("../modules/multivalue/x32wordArray");
    import Utf8String = require("../modules/multivalue/utf8string");
    import Base64 = require("../modules/multivalue/base64");
    import Hex = require("../modules/multivalue/hex");

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
