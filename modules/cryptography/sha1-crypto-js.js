"use strict";

var hashFn = require("../crypto-js/sha1-helper");
var WordArray = require("../multivalue/x32wordArray");
var SHA1 = function (value) {
    var arr = value.as(WordArray);
    var hash = hashFn(arr.value);
    return new WordArray(hash);
};

module.exports = SHA1;