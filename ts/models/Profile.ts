    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import Event = require("tools/event");
    import eventEmitter = require("modules/events/eventEmitter");
    import serializable = require("modules/serialization/serializable");
    import Model = require("tools/model");
    import urandom = require("modules/urandom/urandom");
    import Dialog = require("models/Dialog");
    import GrConnection = require("models/grConnection/GrConnection");
    import CouchTransport = require("models/tlConnection/CouchTransport");
    import GroupChat = require("models/GroupChat");

    export class Profile extends Model.Model implements ISerializable {
        public onUrlChanged : Event.Event<any>;
        public grConnections : Array<GrConnection.GrConnection>;
        public dialogs : Array<any>;
        public app : any;
        public bg : any;
        public documents : any;
        public contacts : any;
        public name : string;
        public tlConnections : any;
        public serverUrl : string;
        public unreadCount : number;
        public transport : CouchTransport.CouchTransport;
        public notificationType : string;

        public static NOTIFICATION_NONE = "1";
        public static NOTIFICATION_COUNT = "2";
        public static NOTIFICATION_MESSAGE = "3";

        private _gcByInviteId : any;

        constructor () {
            super();

            this.onUrlChanged = new Event.Event<any>("Profile.onUrlChanged");
        this.app = null;
        this.bg = null;
        this.documents = [];
        this.contacts = [];
        this.tlConnections = [];
        this.dialogs = [];
        this.grConnections = [];
        this.serverUrl = "";
        this.unreadCount = 0;

        this.transport = null;
    }

        // called by factory
        setApp  (app) {
            this.app = app;
            this.serverUrl = app.defaultPollingUrl;
            this._gcByInviteId = {};
        }

        init  (args) {
            invariant(args, "args required");
            invariant(args.name && (typeof args.name === "string"), "args.name must be non-empty string");
            invariant(args.serverUrl && (typeof args.serverUrl === "string"), "args.serverUrl must be non-empty string");
            invariant(typeof args.bg === "number", "args.bg must be number");

            this.name = args.name;
            this.bg = args.bg;
            this.serverUrl = args.serverUrl;

            this.transport = this.getFactory().createTransport();
            this.transport.init({postingUrl: this.serverUrl, pollingUrl: this.serverUrl});
            this._onChanged();
        }

        setUrl  (url) {
            url = url.toLowerCase().replace(/\/$/g, "");
            if (this.serverUrl !== url) {
                this.serverUrl = url;
                console.warn("transport.changeUrl is not yet implemented");
//                this.transport.setPollingUrl(url);
//                this.transport.setPostingUrl(url);
                this._onChanged();
            }
        }

        createDocument  () {
            this.checkFactory();
            var document = this.getFactory().createDocument();
            document.init({
                name: urandom.animal()
            });
            this.documents.push(document);
            this._onChanged();
            return document;
        }

        createContact  () {
            this.checkFactory();
            var contact = this.getFactory().createContact(this);
            var contactTlConnection = this._createTlConnection();
            this._addTlConnection(contactTlConnection);
            contact.init({
                name : urandom.name(),
                tlConnection: contactTlConnection
            });
            this.contacts.push(contact);
            this._linkContact(contact);
            this._onChanged();
            return contact;
        }

        startDirectDialog  (contact, firstMessage?: any) {
            this.checkFactory();
            var dialog = this._findDirectDialog(contact);
            if (!dialog) {
                dialog = this.getFactory().createDialog();
                dialog.init({name: contact.name});
                dialog.setContact(contact); 
                this.dialogs.push(dialog);
                this._linkDialog(dialog);
                if (firstMessage) {
                    dialog.processMessage(firstMessage);
                }
                this._onChanged();
            }
            return dialog;
        }

        leaveGroupChat  (groupChat) {
            var i = this.dialogs.indexOf(groupChat);
            if (i !== -1) {
                for (var key in this._gcByInviteId) {
                    if (this._gcByInviteId[key] == this.dialogs[i]){
                        delete this._gcByInviteId[key];
                    }
                }
                this.dialogs.splice(i, 1);
            }

            groupChat.off("changed", this._onDialogChanged, this);
            i = this.grConnections.indexOf(groupChat.grConnection);
            if(i !== -1) {
                this.grConnections.splice(i, 1);
            }
            groupChat.destroy();
            this._onChanged();
        }

        groupChatByInviteId  (id) {
            return this._gcByInviteId[id];
        }

        private _handleInviteAccepted  (obj/*displayName, invite*/) {
            this.startGroupChat(obj.invite, null, obj.displayName);
        }

        startGroupChat  (invite, contact, displayName) {
            this.checkFactory();
            if (invite) {
                //maybe we already have this group chat
                for (var key in this.dialogs) {
                    if (this.dialogs[key] instanceof GroupChat.GroupChat) {
                        //if (this.dialogs[key].tlgr.getUID() === invite.invite.groupUid) {
                         //   return this.dialogs[key];
                       // }
                    }
                }
                contact = invite.contact;
            } 
            var chatCaption = (contact)?("Group: " + contact.name + " and others..."):("Group Chat " + Math.random())
            var chat = this.getFactory().createGroupChat();
            var grConnection = this.getFactory().createGrConnection();
            grConnection.init({
                invite: (invite)?(invite.invite):null,
                userName: displayName,
                transport: this.transport
            });

            chat.init({
                name: chatCaption,
                grConnection: grConnection
            });
            this.grConnections.push(grConnection);
            this.dialogs.push(chat);
            if (invite) {
                this._gcByInviteId[invite.id] = chat;
            }
            
            this._linkDialog(chat);
            this._onChanged();
            //console.log("startGroupChat", invite);
            return chat;
        }

        private _linkDialog  (dialog) {
            dialog.onChanged.on(this._onDialogChanged, this);
        }

        private _onDialogChanged  () {
            var havingUnread = this.dialogs.filter(function (dialog) { return dialog.unreadCount > 0; });
            if (havingUnread.length !== this.unreadCount) {
                this.unreadCount = havingUnread.length;
                this._onChanged();
            }
        }

        private _createTlConnection  () {
            this.checkFactory();
            var tlConnection = this.getFactory().createTlConnection();
            tlConnection.init();
            return tlConnection;
        }

        private _addTlConnection  (conn) {
            this._linkTlConnection(conn);
            this.tlConnections.push(conn);
        }

        private _findDirectDialog  (contact) {
            var i;
            for (i = 0; i < this.dialogs.length; i += 1) {
                if (this.dialogs[i] instanceof Dialog.Dialog) {
                    if (this.dialogs[i].contact === contact) {
                        return this.dialogs[i];
                    }
                }
            }
            return null;
        }

        serialize  (packet, context) {
            packet.setData({
                name: this.name,
                bg: this.bg,
                serverUrl: this.serverUrl,
                unread: this.unreadCount
            });

            packet.setLink("documents", context.getPacket(this.documents));
            packet.setLink("contacts", context.getPacket(this.contacts));
            packet.setLink("dialogs", context.getPacket(this.dialogs));
            packet.setLink("tlConnections", context.getPacket(this.tlConnections));
            packet.setLink("transport", context.getPacket(this.transport));
            packet.setLink("grConnections", context.getPacket(this.grConnections));
        }

        deserialize  (packet, context) {
            this.checkFactory();
            var factory = this.getFactory();
            var data = packet.getData();
            this.name = data.name;
            this.bg = data.bg;
            this.serverUrl = data.serverUrl;
            this.unreadCount = data.unread;
            this.transport = context.deserialize(packet.getLink("transport"), factory.createTransport, factory);
            this.documents = context.deserialize(packet.getLink("documents"), factory.createDocument, factory);
            this.contacts = context.deserialize(packet.getLink("contacts"), factory.createContact, factory);
            this.contacts.forEach(this._linkContact, this);
            this.grConnections = context.deserialize(packet.getLink("grConnections"), factory.createGrConnection, factory);
            this.tlConnections = context.deserialize(packet.getLink("tlConnections"), factory.createTlConnection, factory);
            this.dialogs = context.deserialize(packet.getLink("dialogs"), factory.createDialogLikeObj, factory);
            this.dialogs.forEach(this._linkDialog, this);
            //this.grConnections.forEach(function (grCon) { grCon.on("changed", this._onChanged, this); }, this);
            this.tlConnections.forEach(this._linkTlConnection, this);
            this.tlConnections.forEach(function (con) { con.run(); });
        }

        private _linkTlConnection  (conn) {
            conn.onMessage.on(this._onTlConnectionMessage, this);
        }

        private _linkContact  (contact) {
            contact.onInviteReceived.on(this._inviteReceived, this);
            contact.onInviteAccepted.on(this._handleInviteAccepted, this);
        }

        private _inviteReceived (invite : ITlgrInvitationWrapper) {
            var dialog = this.startDirectDialog(invite.contact);
            dialog.processInvite(invite);
        }

        private _onTlConnectionMessage  (message, tlConnection) {
            var found = this.contacts.filter(function (contact) {
                return contact.tlConnection === tlConnection;
            });
            if (found.length > 0) {
                // just start a new dialog
                var dialog = this.startDirectDialog(found[0], message);
            }
        }


    };
extend(Profile.prototype, serializable);

