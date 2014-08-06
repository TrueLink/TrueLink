define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var urandom = require("modules/urandom/urandom");
    var CouchAdapter = require("models/tlConnection/CouchAdapter");
    var Dialog = require("models/Dialog");
    var GroupChat = require("models/GroupChat");

    function Profile() {
        this._defineEvent("changed");
        this._defineEvent("urlChanged");

        this.app = null;
        this.bg = null;
        this.documents = [];
        this.contacts = [];
        this.tlConnections = [];
        this.dialogs = [];
        this.tlgrs = [];
        this.serverUrl = "";
        this.unreadCount = 0;

        this.transport = null;
    }

    extend(Profile.prototype, eventEmitter, serializable, model, {
        // called by factory
        setApp: function (app) {
            this.app = app;
            this.serverUrl = app.defaultPollingUrl;
        },

        init: function (args) {
            invariant(args, "args required");
            invariant(args.name && (typeof args.name === "string"), "args.name must be non-empty string");
            invariant(args.serverUrl && (typeof args.serverUrl === "string"), "args.serverUrl must be non-empty string");
            invariant(typeof args.bg === "number", "args.bg must be number");

            this.name = args.name;
            this.bg = args.bg;
            this.serverUrl = args.serverUrl;

            this.transport = this._factory.createTransport();
            this.transport.init({postingUrl: this.serverUrl, pollingUrl: this.serverUrl});
            this._onChanged();
        },

        setUrl: function (url) {
            url = url.toLowerCase().replace(/\/$/g, "");
            if (this.serverUrl !== url) {
                this.serverUrl = url;
                console.warn("transport.changeUrl is not yet implemented");
//                this.transport.setPollingUrl(url);
//                this.transport.setPostingUrl(url);
                this._onChanged();
            }
        },

        createDocument: function () {
            this.checkFactory();
            var document = this._factory.createDocument();
            document.init({
                name: urandom.animal()
            });
            this.documents.push(document);
            this._onChanged();
            return document;
        },

        createContact: function () {
            this.checkFactory();
            var contact = this._factory.createContact(this);
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
        },

        startDirectDialog: function (contact, firstMessage) {
            this.checkFactory();
            var dialog = this._findDirectDialog(contact);
            if (!dialog) {
                dialog = this._factory.createDialog();
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
        },

        startGroupChat: function (invite, contact) {
            this.checkFactory();
            if (invite) {
                //maybe we already have this group chat
                for (var key in this.dialogs) {
                    if (this.dialogs[key] instanceof GroupChat) {
                        if (this.dialogs[key].tlgr.getUID() === invite.invite.groupUid) {
                            return this.dialogs[key];
                        }
                    }
                }
                contact = invite.contact;
            }
            var chatCaption = (contact)?(contact.name + " and others..."):("...")
            var chat = this._factory.createGroupChat();
            var tlgr = this._factory.createTlgr();
            this._linkTlgr(tlgr);

            chat.init({
                name: chatCaption,
                tlgr: tlgr
            });
            tlgr.init({
                invite: (invite)?(invite.invite):null,
                userName: this.name
            });
            this.tlgrs.push(tlgr);
            this.dialogs.push(chat);
            
            this._linkDialog(chat);
            this._onChanged();
            //console.log("startGroupChat", invite);
            return chat;
        },

        _linkDialog: function (dialog) {
            dialog.on("changed", this._onDialogChanged, this);
        },

        _linkTlgr: function (tlgr) {
            tlgr.on("packet", function (packet/*{addr, data}*/) {
                this.transport.sendPacket(packet);
            }.bind(this), tlgr);

        },

        _onDialogChanged: function () {
            var havingUnread = this.dialogs.filter(function (dialog) { return dialog.unreadCount > 0; });
            if (havingUnread.length !== this.unreadCount) {
                this.unreadCount = havingUnread.length;
                this._onChanged();
            }
        },

        _createTlConnection: function () {
            this.checkFactory();
            var tlConnection = this._factory.createTlConnection();
            tlConnection.init();
            return tlConnection;
        },

        _addTlConnection: function (conn) {
            this._linkTlConnection(conn);
            this.tlConnections.push(conn);
        },

        _findDirectDialog: function (contact) {
            var i;
            for (i = 0; i < this.dialogs.length; i += 1) {
                if (this.dialogs[i] instanceof Dialog) {
                    if (this.dialogs[i].contact === contact) {
                        return this.dialogs[i];
                    }
                }
            }
            return null;
        },

        serialize: function (packet, context) {
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
            packet.setLink("tlgrs", context.getPacket(this.tlgrs));
        },

        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            var data = packet.getData();
            this.name = data.name;
            this.bg = data.bg;
            this.serverUrl = data.serverUrl;
            this.unreadCount = data.unread;
            this.transport = context.deserialize(packet.getLink("transport"), factory.createTransport, factory);
            this.documents = context.deserialize(packet.getLink("documents"), factory.createDocument, factory);
            this.contacts = context.deserialize(packet.getLink("contacts"), factory.createContact, factory);
            this.contacts.forEach(this._linkContact, this);
            this.dialogs = context.deserialize(packet.getLink("dialogs"), factory.createDialogLikeObj, factory);
            this.tlgrs = context.deserialize(packet.getLink("tlgrs"), factory.createTlgr, factory);
            this.tlConnections = context.deserialize(packet.getLink("tlConnections"), factory.createTlConnection, factory);
            this.tlConnections.forEach(this._linkTlConnection, this);
            this.tlConnections.forEach(function (con) { con.run(); });
            this.tlgrs.forEach(this._linkTlgr, this);
            //hacky
            this.tlgrs.forEach(function (tlgr) { tlgr.afterDeserialize(); });

        },

        _linkTlConnection: function (conn) {
            conn.on("message", this._onTlConnectionMessage, this);
        },

        _linkContact: function (contact) {
            contact.on("inviteReceived", this._inviteReceived, this);
            contact.on("inviteAccepted", this.startGroupChat, this);
        },

        _inviteReceived: function(invite) {
            var dialog = this.startDirectDialog(invite.contact);
            dialog.processInvite(invite);
        },

        _onTlConnectionMessage: function (message, tlConnection) {
            var found = this.contacts.filter(function (contact) {
                return contact.tlConnection === tlConnection;
            });
            if (found.length > 0) {
                // just start a new dialog
                var dialog = this.startDirectDialog(found[0], message);
            }
        }


    });

    module.exports = Profile;
});
