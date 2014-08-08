define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var prototype = require("./prototype");
    var Tlgr = require("modules/channels/Tlgr");
    var Document = require("models/Document");
    var Contact = require("models/Contact");
    var Dialog = require("models/Dialog");
    var GroupChat = require("models/GroupChat");

    var TlConnection = require("models/tlConnection/TlConnection");
    var GrConnection = require("models/grConnection/GrConnection");
    var GrConnectionFactory = require("./grConnectionFactory");
    var TlConnectionFactory = require("./tlConnectionFactory");

    var CouchTransport = require("models/tlConnection/CouchTransport");

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
        createRandom: function () {
            return this.getInstance("Random");
        },

        createDialogLikeObj: function (packet) {
            var data = packet.getData();
            if(!data._type_) {
                return this.createDialog();
            }
            if(data._type_ === "Dialog"){
                return this.createDialog();
            }else if(data._type_ === "GroupChat"){
                return this.createGroupChat();
            }
        },
        createGroupChat: function () {
            var chat = new GroupChat();
            chat.setProfile(this.profile);
            chat.setFactory(this);
            return this._observed(chat);
        },

        createDocument: function () {
            var document = new Document();
            document.setProfile(this.profile);
            document.setFactory(this);
            return this._observed(document);
        },

        createTransport: function () {
            return this._observed(new CouchTransport());
        },

        createGrConnection: function () {
            var grConnection = new GrConnection();
            var grConnectionFactory = new GrConnectionFactory(this.serializer, grConnection, this.profile);
            grConnection.setFactory(grConnectionFactory);
            return grConnection;
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
