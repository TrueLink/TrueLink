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

    function init(crypto) {
        sugar.setEncryptor(crypto);
        sugar.connect("truelink");
    }

    //function getProfiles

    return {
        init: init
    };
});