define(["modules/sjcl/aes",
    "modules/sjcl/cbc",
    "modules/converters/sjcl",
    "modules/data-types/bitArray"
], function (AesAlg, cbc, sj, BitArray) {
    "use strict";
    /**
     * Schedule out an AES key for both encryption and decryption.
     * @constructor
     * @param {Array} key The key as an array of 4, 6 or 8 words.
     */
    var Aes = function (key) {
        if (!key) {
            this.aes = new AesAlg();
            return this;
        }
        key = key.as(BitArray);
        var length = key.bitLength();
        if (length != 128 && length != 256) {
            key =  key.shiftRight(128 - length);
        }
        this.aes = new AesAlg(key.value);
    };

    Aes.prototype = {
        encryptCbc : function (plaintext, iv) {
            iv = iv ? iv.as(BitArray).value : [0, 0, 0, 0];
            plaintext = plaintext.as(BitArray).value;
            return new BitArray(cbc.encrypt(this.aes, plaintext, iv));
        },
        decryptCbc : function (ciphertext, iv) {
            iv = iv ? iv.as(BitArray).value : [0, 0, 0, 0];
            ciphertext = ciphertext.as(BitArray).value;
            return new BitArray(cbc.decrypt(this.aes, ciphertext, iv));
        }
    };

    return Aes;
});