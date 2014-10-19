define(function (require, exports, module) {
    "use strict";
    var Hasher = require("./hasher");
    var SHA3 = require("./sha3");

    module.exports = Hasher._createHelper(SHA3);
});