define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var urandom = require("modules/urandom/urandom");

    function Profile() {
        this._defineEvent("changed");
        this._defineEvent("urlChanged");

        this.app = null;
        this.bg = null;
        this.documents = [];
        this.contacts = [];
        this.tlConnections = [];
        this.dialogs = [];
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
            this._onChanged();
            return contact;
        },

        startDirectDialog: function (contact, firstMessage) {
            this.checkFactory();
            var dialog = this._findDirectDialog(contact);
            if (!dialog) {
                dialog = this._factory.createDialog();
                dialog.init({name: contact.name});
                dialog.addContact(contact);
                this.dialogs.push(dialog);
                this._linkDialog(dialog);
                if (firstMessage) {
                    dialog.processMessage(firstMessage);
                }
                this._onChanged();
            }
            return dialog;
        },

        _linkDialog: function (dialog) {
            dialog.on("changed", this._onDialogChanged, this);
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
                if (this.dialogs[i].contacts.length === 1 &&  this.dialogs[i].contacts[0] === contact) {
                    return this.dialogs[i];
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
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            var data = packet.getData();
            this.name = data.name;
            this.bg = data.bg;
            this.serverUrl = data.serverUrl;
            this.unreadCount = data.unread;
            this.documents = context.deserialize(packet.getLink("documents"), factory.createDocument, factory);
            this.contacts = context.deserialize(packet.getLink("contacts"), factory.createContact, factory);
            this.dialogs = context.deserialize(packet.getLink("dialogs"), factory.createDialog, factory);
            this.dialogs.forEach(this._linkDialog, this);
            this.tlConnections = context.deserialize(packet.getLink("tlConnections"), factory.createTlConnection, factory);
            this.tlConnections.forEach(this._linkTlConnection, this);
            this.transport = context.deserialize(packet.getLink("transport"), factory.createTransport, factory);

        },
        _linkTlConnection: function (conn) {
            conn.on("message", this._onTlConnectionMessage, this);
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