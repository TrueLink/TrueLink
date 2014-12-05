    "use strict";
    import modules = require("modules");
    import invariant = require("invariant");
    import extend = require("../tools/extend");
    import Event = require("../tools/event");
    var serializable = modules.serialization.serializable;
    import Model = require("../tools/model");
    var urandom = modules.urandom.urandom;
    import GrConnection = require("../models/grConnection/GrConnection");
    import CouchTransport = require("../models/tlConnection/CouchTransport");

    import Contact = require("../models/Contact");
    import MessageHistory = require("../models/MessageHistory");
    import notifications = require("../tools/notifications-api");
    import SyncObject = require("../models/SyncObject");

    import model = require("../mixins/model");
    import CouchAdapter = require("../models/tlConnection/CouchAdapter");

    import uuid = require("uuid");

    import MultivalueModule = require("Multivalue");
    var Hex = MultivalueModule.Hex;

    export class Profile extends Model.Model implements ISerializable {
        //public onUrlChanged : Event.Event<any>; maybe it was used long time ago
        public grConnections : Array<GrConnection.GrConnection>;
        public dialogs : Array<any>;
        public app : any;
        public bg : any;
        public documents : any;
        public contacts : any;
        public temporaryName : string;
        public publicityType : string;
        public name : string;
        public email : string;
        public phoneNumber : string;
        public tlConnections : any;
        public serverUrl : string;
        public unreadCount : number;
        public transport : CouchTransport.CouchTransport;
        public notificationType : string;
        public notificationSound : string;
        public sync: SyncObject.SyncObject;
        public uuid: string;

        public static NOTIFICATION_NONE = "1";
        public static NOTIFICATION_COUNT = "2";
        public static NOTIFICATION_MESSAGE = "3";

        private _gcByInviteId : any;

        constructor () {
            super();

            this.uuid = uuid();

            //this.onUrlChanged = new Event.Event<any>("Profile.onUrlChanged");
            this.app = null;
            this.bg = null;
            this.documents = [];
            this.contacts = [];
            this.tlConnections = [];
            this.dialogs = [];
            this.grConnections = [];
            this.serverUrl = "";
            this.unreadCount = 0;
            this.notificationType = Profile.NOTIFICATION_MESSAGE;

            this.transport = null;
            this.sync = null;
        }

        // called by factory
        setApp  (app) {
            this.app = app;
            this.serverUrl = app.defaultPollingUrl;
            this._gcByInviteId = {};
        }

        preinit() {
        }

        init  (args) {
            invariant(args, "args required");
            invariant(args.name && (typeof args.name === "string"), "args.name must be non-empty string");
            invariant(args.serverUrl && (typeof args.serverUrl === "string"), "args.serverUrl must be non-empty string");
            invariant(typeof args.bg === "number", "args.bg must be number");
            
            this.temporaryName = undefined;

            if (this.publicityType != "public") {
                this.email = undefined;
                this.phoneNumber = undefined;
            }


            this.name = args.name;
            this.bg = args.bg;

            if(!this.sync) {
                this._initTransport(args);
                this._initSync(this.transport, true);          
            
                this._sendSyncMessage({
                    what: "userinfo-edited",
                    args: {
                        name: this.name,
                        publicityType: this.publicityType,
                        email: this.email,
                        phoneNumber: this.phoneNumber,
                        bg: this.bg
                    }
                });
            }
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

        createContact(syncArgs?) {
            syncArgs = syncArgs || {};

            this.checkFactory();
            var contact = this.getFactory().createContact(this);
            var contactTlConnection = this._createTlConnection(syncArgs.args);
            this._addTlConnection(contactTlConnection);
            contact.init({
                id : syncArgs.id || uuid(),
                name : syncArgs.name || urandom.name(),
                tlConnection: contactTlConnection
            });
            this.contacts.push(contact);
            this._linkContact(contact);
            this._onChanged();
            return contact;
        }

        // for the unfinished profile to be synced with profile created on another device
        startSyncing (args) {
            this._initTransport(args);
            this._initSync(this.transport, false);
        }

        private _initTransport(args) {
            this.serverUrl = args.serverUrl;
            this.transport = this.getFactory().createTransport();
            this.transport.init({postingUrl: this.serverUrl, pollingUrl: this.serverUrl});
        }

        private _initSync(transport, isMaster) {
            this.sync = this.getFactory().createSync();
            this._linkSync();
            this.sync.init({
                transport: this.transport,
                master: isMaster,
                profileUuid: this.uuid
            });
            this.__debug_createSyncGroupChat(this.sync.grConnection);        
        }

        private _linkSync() {
            if (!this.sync) {
                // this would happen on deserialization of profile being in creation process 
                return;
            }

            this.sync.onSyncMessage.on(this._processSyncMessage, this);    
            this.sync.onDeviceAdded.on(this._handleNewSyncDevice, this);                
        }

        private _handleNewSyncDevice(newProfileId: string) {
            this.tlConnections.forEach(conn => conn.addCowriter(newProfileId));
        }

        private _processSyncMessage(message: ITlgrTextMessageWrapper) {
            console.log(this.name, "got sync message", message);

            var args = JSON.parse(message.text);
            if (args.what === "userinfo-edited") {
                this._updateUserInfo(args.args);
            } else if (args.what === "contact-created") {
                var contact = this.createContact(args.args);
                var dialog = this.startDirectDialog(contact);                
            } else if (args.what === "tlConnection") {
                this.tlConnections.forEach(conn => conn.processSyncMessage(args.args));
            }
        }

        //todo separate them all
        private _updateUserInfo(args) {
            this.name = args.name;
            this.publicityType = args.publicityType;
            this.email = args.email;
            this.phoneNumber = args.phoneNumber;
            this.bg = args.bg;

            this._onChanged();                    
        }

        private _sendSyncMessage(data: any) {
            this.sync.sendSyncMessage(data);
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
                    if (this.dialogs[key] instanceof GroupChat) {
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

        __debug_createSyncGroupChat(grConnection: GrConnection.GrConnection): GroupChat {
            var chat = this.getFactory().createGroupChat();
            chat.init({
                name: "Sync (debug)",
                grConnection: grConnection
            });
            this.dialogs.push(chat);
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

        private _createTlConnection (syncArgs?) {
            this.checkFactory();
            var tlConnection = this.getFactory().createTlConnection();
            tlConnection.init({
                profileId: this.uuid
            }, syncArgs);
            return tlConnection;
        }

        private _addTlConnection  (conn) {
            this._linkTlConnection(conn);
            this.tlConnections.push(conn);
        }

        private _findDirectDialog  (contact) {
            var i;
            for (i = 0; i < this.dialogs.length; i += 1) {
                if (this.dialogs[i] instanceof Dialog) {
                    if (this.dialogs[i].contact === contact) {
                        return this.dialogs[i];
                    }
                }
            }
            return null;
        }

        serialize  (packet, context) {
            packet.setData({
                uuid: this.uuid,
                temporaryName: this.temporaryName,
                publicityType: this.publicityType,
                name: this.name,
                email: this.email,
                phoneNumber: this.phoneNumber,
                bg: this.bg,
                serverUrl: this.serverUrl,
                unread: this.unreadCount,
                notificationType: this.notificationType,
                notificationSound: this.notificationSound
            });

            packet.setLink("documents", context.getPacket(this.documents));
            packet.setLink("contacts", context.getPacket(this.contacts));
            packet.setLink("dialogs", context.getPacket(this.dialogs));
            packet.setLink("tlConnections", context.getPacket(this.tlConnections));
            packet.setLink("transport", context.getPacket(this.transport));
            packet.setLink("grConnections", context.getPacket(this.grConnections));
            packet.setLink("sync", context.getPacket(this.sync));
        }

        deserialize  (packet, context) {
            this.checkFactory();
            var factory = this.getFactory();
            var data = packet.getData();
            this.uuid = data.uuid;
            this.temporaryName = data.temporaryName;
            this.publicityType = data.publicityType;
            this.name = data.name;
            this.email = data.email;
            this.phoneNumber = data.phoneNumber;
            this.bg = data.bg;
            this.serverUrl = data.serverUrl;
            this.unreadCount = data.unread;
            this.notificationType = (data.notificationType) ? (data.notificationType) : (Profile.NOTIFICATION_MESSAGE);
            this.notificationSound = (data.notificationSound) ? (data.notificationSound) : ("audiotag1");
            this.transport = context.deserialize(packet.getLink("transport"), factory.createTransport, factory);
            this.documents = context.deserialize(packet.getLink("documents"), factory.createDocument, factory);
            this.contacts = context.deserialize(packet.getLink("contacts"), factory.createContact, factory);
            this.contacts.forEach(this._linkContact, this);
            this.sync = context.deserialize(packet.getLink("sync"), factory.createSync, factory);
            this._linkSync();
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
            conn.onSyncMessage.on(this._onTlConnectionSyncMessage, this);
            conn.onDone.on(this._onTlConnectionDone, this);
        }

        private _linkContact  (contact) {
            contact.onInviteReceived.on(this._inviteReceived, this);
            contact.onInviteAccepted.on(this._handleInviteAccepted, this);
            contact.onReadyForSync.on(this._handleContactReadyForSync, this);
        }

        private _handleContactReadyForSync(args) {
            this._sendSyncMessage({
                what: "contact-created",
                args: args
            });          
        }

        private _onTlConnectionSyncMessage(args) {
            this._sendSyncMessage({
                what: "tlConnection",
                args: args
            });            
        }

        private _onTlConnectionDone(args, sender) {
            var conn = sender;
            this.sync.devices.forEach(device => { 
                if (device.name === this.uuid) { return; }
                conn.addCowriter(device.name);
            });              
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

/////// HACK AVOID CYCLIC DEP



    export class Dialog extends Model.Model implements ISerializable {
        public profile : Profile;
        public name : string;
        public history : MessageHistory.MessageHistory;
        public contact : Contact.Contact;
        public unreadCount : number;

        constructor () {

            super();
            this.profile = null;
            this.name = null;
            this.history = null;
            this.contact = null;
            this.unreadCount = 0;

        }

        setProfile  (profile: Profile) {
            this.profile = profile;
        }

        init  (args) {
            invariant(args.name, "Can i haz args.name?");
            this.name = args.name;
            this.history = new MessageHistory.MessageHistory();
            this._onChanged();
        }

        setContact  (contact:Contact.Contact, skipChanged) {
            if (this.contact) {
                return;
            }
            this.contact = contact;
            contact.tlConnection.onMessage.on(this._processMessage, this);
            if (!skipChanged) {
                this._onChanged();
            }
        }

        sendMessage  (message: string) {
            var msg: ITextMessage = {
                text: message,
                sender: this.profile.name,
                type: "text"
            };
            this._pushMessage(extend({}, msg, {
                isMine: true
            }));
            if (this.contact) {
                this.contact.tlConnection.sendMessage(msg);
            }
            this._onChanged();
        }

        processInvite  (invite : ITlgrInvitationWrapper) {
            var message : any = {};
            message.type = "tlgr-invite";
            message.sender = invite.contact.name;
            message.inviteId = invite.id;
            message.unread = true;
            message.accepted = null;
            message.accept = (function (inviteId, displayName) {
                this.accepted = true;
                invite.contact.acceptInvite(message.inviteId, displayName);
            }).bind(message);
            message.reject = (function () {
                this.accepted = false;
                invite.contact.rejectInvite(this.inviteId);
            }).bind(message);
            this._pushMessage(message);
        }

        _processMessage  (message : IUserMessage) {
            if(message.type !== "text") {
                return;
            }
            var tlConnection = message.metadata.tlConnection;
            if (this.contact.tlConnection === tlConnection) {
                message.sender = this.contact.name;
            }
            message.unread = true;
            this._pushMessage(message);
        }

        _pushMessage  (message : IUserMessage) {
            message.time = new Date();
            if (message.metadata) {
                delete message.metadata;
            }
            //message.dialog = this;
            this.history.recordMessage(message);
            if (message.unread) {
                this.unreadCount += 1;
                if (this.profile.notificationType === Profile.NOTIFICATION_COUNT) {
                    notifications.notify(this.name + " ( " + this.profile.name + " )", this.unreadCount + " unread messages.");
                } else if (this.profile.notificationType === Profile.NOTIFICATION_MESSAGE) {
                    notifications.notify(this.name + " ( " + this.profile.name + " )", (<any>message).text);
                }
                notifications.playMessageArrivedSound(this.profile);
            }
            this._onChanged();
        }

        markAsRead  () {
            var hiddenProperty = 'hidden' in document ? 'hidden' :
                              'webkitHidden' in document ? 'webkitHidden' :
                              'mozHidden' in document ? 'mozHidden' :
                              null;
            if (document[hiddenProperty] === true) {
                console.log("mark as read while hidden");
                return;
            }
            if (this.unreadCount) {
                this.history.getHistory().forEach(function (msg) {
                    if (msg.unread) {
                        msg.unread = false;
                    }
                });
                this.unreadCount = 0;
                this._onChanged();
            }
        }
        hasSecureChannels () {
            if (!this.contact) {
                return false;
            }
            if (!this.contact.tlConnection) {
                return false;
            }
            return this.contact.tlConnection.canSendMessages();
        }

        serialize  (packet, context) {
            var firstUnreadIndex = null,
                lastUnreadIndex = null;
            packet.setLink("history", context.getPacket(this.history));
            packet.setData({
                _type_: "Dialog",
                name: this.name,
                unread: this.unreadCount
            });
            packet.setLink("contact", context.getPacket(this.contact));
        }
        deserialize  (packet, context) {
            this.checkFactory();
            var data = packet.getData();
            var factory = this.getFactory();
            this.name = data.name;
            this.unreadCount = data.unread;
            var contact = context.deserialize(packet.getLink("contact"), factory.createContact, factory);
            this.history = context.deserialize(packet.getLink("history"), factory.createMessageHistory, factory);
            if (!this.history) {
                this.history = new MessageHistory.MessageHistory();
            }
            // true = skip firing change event
            this.setContact(contact, true);
        }

    };

extend(Dialog.prototype, serializable);




    export class GroupChat extends Model.Model implements ISerializable {
        public profile : Profile;
        public grConnection : GrConnection.GrConnection;
        public name : string;
        
        public history : MessageHistory.MessageHistory;
        private unreadCount : number;
        
        constructor () {
            super();
            console.log("Constructing GroupChat...");
            this.profile = null;
            this.grConnection = null;
            this.name = null;
            this.history = new MessageHistory.MessageHistory();
            this.unreadCount = 0;
        }

        setProfile (profile) {
            this.profile = profile;
        }

        init  (args) {
            invariant(args.name, "Can i haz args.name?");
            invariant(args.grConnection, "Can i haz args.grConnection?");
            
            this.name = args.name;
            this.grConnection = args.grConnection;
            this._setTlgrEventHandlers();
            this._onChanged();
        }

        _handleUserJoined  (user : ITlgrShortUserInfo) {
            if (user.aid === this.grConnection.getMyAid()) {
                this._pushMessage({
                    text: "You have joined a chat",
                    sender: "system"
                });
            } else {
                var t = user.name + " (" + user.aid.substring(0,4) + ")" + " joined this chat";
                if (user.oldchannel) {
                    t = "old channel: " + t;
                }
                this._pushMessage({
                    text: t,
                    sender: "system"
                });
            }
        }

        _handleUserLeft  (user: ITlgrShortUserInfo) {
            if (user === this.grConnection.getMyAid()) {
                //probably won't see this
                this._pushMessage({
                    text: "You have left this chat",
                    sender: "system"
                });
            } else {
                var t = user.name + " (" + user.aid.substring(0,4) + ")" + " has left this chat";
                if (user.oldchannel) {
                    t = "old channel: " + t;
                }
                this._pushMessage({
                    text: t,
                    sender: "system"
                });
            }
        }

        _setTlgrEventHandlers  () {
            this.grConnection.onMessage.on(this.processMessage, this);
            this.grConnection.onUserJoined.on(this._handleUserJoined, this);
            this.grConnection.onUserLeft.on(this._handleUserLeft, this);
        }

        sendMessage  (message : string) {
            var msg : ITextMessage = {
                text: message,
                sender: this.grConnection.getMyName() + " (" + this.grConnection.getMyAid().substring(0,4) + ")"
            }
            msg.isMine = true;
            this._pushMessage(msg);
            if (this.grConnection) {
                this.grConnection.sendMessage(message);
            }
        }

        destroy  () {
            if (this.grConnection) {
                this.grConnection.destroy();
            }
            this.grConnection = null;
        }

        //handleMessage
        processMessage  (message: ITlgrTextMessageWrapper) {
            var m : ITextMessage = {
                isMine : false,
                unread : true,
                sender : message.sender.name ? (message.sender.name + " (" +message.sender.aid.substring(0,4) + ")")  : message.sender.aid.substring(0,4),
                text : message.text
            }

            this._pushMessage(m);
        }

        _pushMessage  (message: ITextMessage) {
            message.time = new Date();
            this.history.recordMessage(message);
            if (message.unread) {
                this.unreadCount += 1;
                if (this.profile.notificationType === Profile.NOTIFICATION_COUNT) {
                    notifications.notify(this.name + " ( " + this.profile.name + " )", this.unreadCount + " unread messages.");
                } else if (this.profile.notificationType === Profile.NOTIFICATION_MESSAGE) {
                    notifications.notify(this.name + " ( " + this.profile.name + " )", (message).text);
                }
                notifications.playMessageArrivedSound(this.profile);
            }
            this._onChanged();
        }

        markAsRead  () {
            var hiddenProperty = 'hidden' in document ? 'hidden' :
                              'webkitHidden' in document ? 'webkitHidden' :
                              'mozHidden' in document ? 'mozHidden' :
                              null;
            if (document[hiddenProperty] === 'hidden') {
                return;
            }
            if (this.unreadCount) {
                this.history.getHistory().forEach(function (msg) {
                    if (msg.unread) {
                        msg.unread = false;
                    }
                });
                this.unreadCount = 0;
                this._onChanged();
            }
        }

        serialize  (packet, context) {
            packet.setData({
                _type_: "GroupChat",
                name: this.name,
                unread: this.unreadCount
            });
            packet.setLink("grConnection", context.getPacket(this.grConnection));
            packet.setLink("history", context.getPacket(this.history));
        }

        deserialize  (packet, context) {
            this.checkFactory();
            var factory = this.getFactory();
            var data = packet.getData();
            this.name = data.name;
            this.unreadCount = data.unread;
            this.grConnection = context.deserialize(packet.getLink("grConnection"), factory.createTlgr, factory);
            this.history = context.deserialize(packet.getLink("history"), factory.createMessageHistory, factory);
            this._setTlgrEventHandlers();
        }

    }
extend(GroupChat.prototype, serializable);
