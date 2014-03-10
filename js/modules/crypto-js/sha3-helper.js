define(["modules/crypto-js/hasher", "modules/crypto-js/sha3"], function (Hasher, SHA3) {
    "use strict";
    return Hasher._createHelper(SHA3);
});