define([
    "q",
    "tools/random",
    "tools/urandom",
    "modules/cryptography/sha3-crypto-js",
    "modules/data-types/base64",
    "modules/data-types/utf8string",
    "modules/data-types/bytes",
    "modules/data-types/bitArray",
    "modules/cryptography/aes-sjcl"], function (Q, random, urandom, sha3, Base64, Utf8String, Bytes, BitArray, Aes) {
    "use strict";

    // will be widely used later for decrypt older entities
    var getMasterKey;
    var rootEntity;

    function generateKeys() {
        var keyList = [];
        var i;
        for (i = 0; i < 100; i++) {
            keyList.push(random.bitArray(256).value);
        }
        return keyList;
    }

    function decryptWithMasterKey(encryptedData) {
        var dfd = Q.defer();

        getMasterKey().then(function (key) {
            try {
                var keysAes = new Aes(key);
                var decrypted = keysAes.decryptCbc(new Base64(encryptedData));
                var dataObj = JSON.parse(decrypted.as(Utf8String).value);
                dfd.resolve(dataObj);
            } catch (e) {
                dfd.reject({error: "login_error", reason: "Invalid password"});
            }
        }, function (err) { dfd.reject(err); });

        return dfd.promise;
    }
    function encryptWithMasterKey(data) {
        var dfd = Q.defer();
        getMasterKey().then(function (key) {
            var keysAes = new Aes(key);
            var plain = JSON.stringify(data);
            var encrypted = keysAes.encryptCbc(new Utf8String(plain));

            dfd.resolve(encrypted.as(Base64).value);

        }, function (err) { dfd.reject(err); });
        return dfd.promise;
    }

    function decryptData(keyIndex, base64Data) {
        var aesKey = new BitArray(rootEntity.getData("keys")[keyIndex]);
        var aes = new Aes(aesKey);
        var plainData = aes.decryptCbc(new Base64(base64Data));
        return JSON.parse(plainData.as(Utf8String).value);
    }
    function encryptData(objData) {
        var keyIndex = urandom.int(0, 99);
        var aesKey = new BitArray(rootEntity.getData("keys")[keyIndex]);
        var aes = new Aes(aesKey);
        var encryptedData = aes.encryptCbc(new Utf8String(JSON.stringify(objData)));
        return {
            encryptionInfo: keyIndex,
            encryptedData: encryptedData.as(Base64).value
        };
    }


    return {
        setRootEntity: function (entity) {
            rootEntity = entity;
        },
        // TODO achtung, all repos are using this function,
        // TODO watch out when moving to a dynamic rootEntity, because rootEntity != repositoryRoot then
        getRootEntity: function () {
            return rootEntity;
        },
        createRootEntity: function () {
            var root = new Entity();
            root.setData("keys", generateKeys());
            return Q(root);
        },

        setGettingPasswordFn : function (promiseOrValue) {
            getMasterKey = function () {
                return Q(promiseOrValue).then(function (password) {
                    return Q(sha3(new Utf8String(password), 256));
                });
            };
        },
        decryptWithMasterKey: decryptWithMasterKey,
        encryptWithMasterKey: encryptWithMasterKey,
        decryptData: decryptData,
        encryptData: encryptData
    };
});