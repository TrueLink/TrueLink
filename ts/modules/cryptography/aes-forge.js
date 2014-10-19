define(function(require, exports, module) {
    "use strict";
    var forge = require("../forge");
    var ByteBuffer = require("../multivalue/byteBuffer");

    exports.encryptCbc = function (data, key, iv) {
        var key = key.as(ByteBuffer).value.copy();
        var aes = forge.cipher.createCipher('AES-CBC', key);
        aes.start({
            iv: iv.as(ByteBuffer).value.copy()
        });
        aes.update(data.as(ByteBuffer).value.copy());
        aes.finish();
        return new ByteBuffer(aes.output);
    }

    exports.decryptCbc = function (data, key, iv) {
        var key = key.as(ByteBuffer).value.copy();
        var aes = forge.cipher.createDecipher('AES-CBC', key);
        aes.start({
            iv: iv.as(ByteBuffer).value.copy()
        });
        aes.update(data.as(ByteBuffer).value.copy());
        aes.finish();
        return new ByteBuffer(aes.output);
    }
});