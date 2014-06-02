define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var Dictionary = require("modules/dictionary/dictionary");
    var extend = require("extend");
    var prototype = require("./prototype");

    var Document = require("models/Document");
    var Contact = require("models/Contact");
    var Dialog = require("models/Dialog");


    function ProfileFactory(serializer) {
        invariant(serializer, "Can i haz serializer?");
        this.serializer = serializer;
        this.profile = null;
    }

    extend(ProfileFactory.prototype, prototype, {
        setProfile: function (profile) {
            this.profile = profile;
        },
        createContact: function () {
            invariant(this.profile, "profile is not set");
            var contact = new Contact();
            contact.setProfile(this.profile);
            contact.setFactory(this);
            return this._observed(contact);
        },
        createDialog: function () {
            invariant(this.profile, "profile is not set");
            var dialog = new Dialog();
            dialog.setProfile(this.profile);
            dialog.setFactory(this);
            return this._observed(dialog);
        },
        createDocument: function () {
            invariant(this.profile, "profile is not set");
            var document = new Document();
            document.setProfile(this.profile);
            document.setFactory(this);
            return this._observed(document);
        }


    });

    module.exports = ProfileFactory;
});