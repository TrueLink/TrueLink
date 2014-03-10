define(["linkDb/sugar", "zepto"], function (sugar, $) {
    "use strict";
    sugar.addLinkMeta("profile", "profiles", "root", "root");
    sugar.addLinkMeta("contact", "contacts", "profile", "profiles");
    sugar.addLinkMeta("dialog", "dialogs", "profile", "profiles");
    sugar.addLinkMeta("dialog", "dialogs", "contact", "contacts");
    sugar.addLinkMeta("document", "documents", "profile", "profiles");
    sugar.addLinkMeta("channel", "channels", "contact", "contacts");
    sugar.addLinkMeta("channel", "channels", "profile", "profile");
    sugar.addLinkMeta("message", "messages", "dialog", "dialogs");

    function createDecryptor(crypto, fn) {
        return function (encryptionInfo, encryptedData) {
            return crypto.decryptWithMasterKey(encryptedData);
        };

    }
    function createEncryptor(crypto, fn) {
        return function (plainData) {
            return crypto.encryptWithMasterKey(plainData).then(function (encryptedData) {
                return {
                    encryptionInfo: undefined,
                    encryptedData: encryptedData
                };
            });
        };
    }

    function init(crypto) {
        sugar.setEncryptor(crypto);
        sugar.connect("truelink");
    }
    // sugar: {
    // addLinkMeta,
    // clearMeta,
    // link,
    // unlink }
    return $.extend({}, sugar, {
        createDecryptor: createDecryptor,
        createEncryptor: createEncryptor,
        init: init
    });
});