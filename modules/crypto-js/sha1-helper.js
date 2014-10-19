define(function (require, exports, module) {
    "use strict";
    var Hasher = require("./hasher");
    var SHA1 = require("./sha1");
    module.exports = Hasher._createHelper(SHA1);
});