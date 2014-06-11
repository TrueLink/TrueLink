define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var prototype = require("./prototype");

    var Document = require("models/Document");
    var Contact = require("models/Contact");
    var Dialog = require("models/Dialog");

    var TlConnection = require("models/tlConnection/TlConnection");
    var TlConnectionFactory = require("./tlConnectionFactory");


    function ProfileFactory(serializer, profile) {
        invariant(serializer, "Can i haz serializer?");
        invariant(profile, "Can i haz profile?");
        this.serializer = serializer;
        this.profile = profile;
    }

    extend(ProfileFactory.prototype, prototype, {
        createContact: function () {
            var contact = new Contact();
            contact.setProfile(this.profile);
            contact.setFactory(this);
            return this._observed(contact);
        },
        createDialog: function () {
            var dialog = new Dialog();
            dialog.setProfile(this.profile);
            dialog.setFactory(this);
            return this._observed(dialog);
        },
        createDocument: function () {
            var document = new Document();
            document.setProfile(this.profile);
            document.setFactory(this);
            return this._observed(document);
        },


        createTlConnection: function () {
            var tlConnection = new TlConnection();
            var tlConnectionFactory = new TlConnectionFactory(this.serializer, tlConnection, this.profile);
            tlConnection.setFactory(tlConnectionFactory);
            return this._observed(tlConnection);
        }
    });

    module.exports = ProfileFactory;
});