    "use strict";
    import modules = require("modules");
    var invariant = modules.invariant;
    import extend = require("../../tools/extend");
    import prototype = require("./prototype");
    import Tlgr = require("Tlgr");
    import Document = require("../../models/Document");
    import Contact = require("../../models/Contact");
    import Profile = require("../../models/Profile");
    import SyncObject = require("../../models/SyncObject");
    //import Dialog = require("../../models/Dialog");
    //import GroupChat = require("../../models/GroupChat");
    import MessageHistory = require("../../models/MessageHistory");

    import SyncFactory = require("./syncFactory");

    import TlConnection = require("../../models/tlConnection/TlConnection");
    import GrConnection = require("../../models/grConnection/GrConnection");
    import GrConnectionFactory = require("./grConnectionFactory");
    import TlConnectionFactory = require("./tlConnectionFactory");

    import CouchTransport = require("../../models/tlConnection/CouchTransport");

    function ProfileFactory(serializer, profile) {
        invariant(serializer, "Can i haz serializer?");
        invariant(profile, "Can i haz profile?");
        this.serializer = serializer;
        this.profile = profile;
    }

    extend(ProfileFactory.prototype, prototype, {
        createContact: function () {
            var contact = new Contact.Contact();
            contact.setProfile(this.profile);
            contact.setFactory(this);
            return this._observed(contact);
        },

        createDialog: function () {
            var dialog = new Profile.Dialog();
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
            var chat = new Profile.GroupChat();
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

        createTransport: function () : ICouchTransport {
            return this._observed(new CouchTransport.CouchTransport());
        },

        createGrConnection: function () {
            var grConnection = new GrConnection.GrConnection();
            var grConnectionFactory = new GrConnectionFactory(this.serializer, grConnection, this.profile.transport);
            grConnection.setFactory(grConnectionFactory);
            return this._observed(grConnection);
        },

        createMessageHistory: function () {
            var history = new MessageHistory.MessageHistory();
            history.setFactory(this);
            return this._observed(history);
        },

        createTlConnection: function () {
            var tlConnection = new TlConnection.TlConnection();
            var tlConnectionFactory = new TlConnectionFactory(this.serializer, tlConnection, this.profile.transport);
            tlConnection.setFactory(tlConnectionFactory);
            return this._observed(tlConnection);
        },

        createSync: function () {
            var sync = new SyncObject.SyncObject();
            var syncFactory = new SyncFactory(this.serializer, sync);
            sync.setFactory(syncFactory);
            return this._observed(sync);  
        },
    });

    export = ProfileFactory;
