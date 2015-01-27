"use strict";
var sjcl = require("sjcl");
var AesAlg = sjcl.cipher.aes;
sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();
var cbc = sjcl.mode.cbc;
var BitArray = require("Multivalue/multivalue/bitArray");
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

module.exports = Aes;