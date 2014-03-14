define(["linkDb/sugar", "zepto", "services/crypto"], function (sugar, $, crypto) {
    "use strict";
    sugar.addLinkMeta("profile", "profiles", "root", "root");
    sugar.addLinkMeta("contact", "contacts", "profile", "profiles");
    sugar.addLinkMeta("dialog", "dialogs", "profile", "profiles");
    sugar.addLinkMeta("dialog", "dialogs", "contact", "contacts");
    sugar.addLinkMeta("document", "documents", "profile", "profiles");
    sugar.addLinkMeta("channel", "channels", "contact", "contacts");
    sugar.addLinkMeta("channel", "channels", "profile", "profile");
    sugar.addLinkMeta("message", "messages", "dialog", "dialogs");

    sugar.connect("truelink");

    function init(rootEntity) {
        var encryptor = crypto.createDbEncryptor(rootEntity);
        sugar.setEncryptor(encryptor);
    }
    function saveRootEntity(entity, encryptor) {
        return sugar.save(entity, encryptor);
    }
    function loadRootEntity(id, encryptor) {
        return sugar.getById(id, encryptor);
    }

    return {
        init: init,
        drop: sugar.drop,
        loadRootEntity: loadRootEntity,
        saveRootEntity: saveRootEntity
    };
});