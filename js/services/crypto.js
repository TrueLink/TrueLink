define([
    "q",
    "linkDb/Entity",
    "tools/random",
    "tools/urandom",
    "modules/cryptography/sha3-crypto-js",
    "modules/data-types/base64",
    "modules/data-types/utf8string",
    "modules/data-types/bytes",
    "modules/data-types/bitArray",
    "modules/cryptography/aes-sjcl"], function (Q, Entity, random, urandom, sha3, Base64, Utf8String, Bytes, BitArray, Aes) {
    "use strict";

    function generateKeys() {
        var keyList = [];
        var i;
        for (i = 0; i < 100; i++) {
            keyList.push(random.bitArray(256).value);
        }
        return keyList;
    }

    function createDbEncryptor(rootEntity) {
        return {
            decryptData: function (keyIndex, base64Data) {
                var aesKey = new BitArray(rootEntity.getData("keys")[keyIndex]);
                var aes = new Aes(aesKey);
                try {
                    var plainData = aes.decryptCbc(new Base64(base64Data));
                    return JSON.parse(plainData.as(Utf8String).value);
                } catch (ex) {
                    throw new Error("Decrypt error");
                }
            },
            encryptData: function (objData) {
                var keyIndex = urandom.int(0, 99);
                var aesKey = new BitArray(rootEntity.getData("keys")[keyIndex]);
                var aes = new Aes(aesKey);
                var encryptedData = aes.encryptCbc(new Utf8String(JSON.stringify(objData)));
                return {
                    encryptionInfo: keyIndex,
                    encryptedData: encryptedData.as(Base64).value
                };
            }
        };
    }

    function createDbMasterEncryptor(password) {
        var masterKey = masterKeyFromPassword(password);
        return {
            decryptData: function (encryptionInfo, encryptedData) {
                var keysAes = new Aes(masterKey);
                try {
                    var decrypted = keysAes.decryptCbc(new Base64(encryptedData));
                    return JSON.parse(decrypted.as(Utf8String).value);
                } catch (ex) {
                    throw new Error("Decrypt error");
                }
            },
            encryptData: function (objData) {
                var keysAes = new Aes(masterKey);
                var plain = JSON.stringify(objData);
                var encrypted = keysAes.encryptCbc(new Utf8String(plain));
                return {
                    encryptionInfo: undefined,
                    encryptedData: encrypted.as(Base64).value
                };
            }

        };
    }

    function masterKeyFromPassword(password) {
        return sha3(new Utf8String(password), 256);
    }

    return {
        createRootEntity: function () {
            var root = new Entity();
            root.setData("keys", generateKeys());
            return root;
        },
        createDbEncryptor: createDbEncryptor,
        createDbMasterEncryptor: createDbMasterEncryptor
    };
});