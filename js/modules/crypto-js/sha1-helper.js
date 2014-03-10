define(["modules/crypto-js/hasher", "modules/crypto-js/sha1"], function (Hasher, SHA1) {
    "use strict";
    return Hasher._createHelper(SHA1);
});