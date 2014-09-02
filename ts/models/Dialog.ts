    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import Event = require("tools/event");
    import serializable = require("modules/serialization/serializable");
    import Profile = require("models/Profile");
    import Contact = require("models/Contact");
    import Model = require("tools/model");
    import TypeFilter = require("models/filters/TypeFilter");

    export class Dialog extends Model.Model implements ISerializable {
        public profile : Profile.Profile;
        public name : string;
        public messages : Array<any>;
        public contact : Contact.Contact;
        public unreadCount : number;
        public typeFilter : any;

        constructor () {

            super();
        this.profile = null;
        this.name = null;
        this.messages = [];
        this.contact = null;
        this.unreadCount = 0;

        this.typeFilter = new TypeFilter("receiver", "dialog");
        this.typeFilter.on("filtered", this._processMessage, this);
        this.typeFilter.on("unfiltered", this._onMessage, this);
    }

        setProfile  (profile) {
            this.profile = profile;
        }

        init  (args) {
            invariant(args.name, "Can i haz args.name?");
            this.name = args.name;
            this._onChanged();
        }

        setContact  (contact, skipChanged) {
            if (this.contact) {
                return;
            }
            this.contact = contact;
            contact.tlConnection.onMessage.on(this.processMessage, this);
            if (!skipChanged) {
                this._onChanged();
            }
        }

        sendMessage  (message) {
            var msg = {
                text: message,
                sender: this.profile.name
            };
            this._pushMessage(extend({}, msg, {
                isMine: true
            }));
            this.typeFilter.unfilter(msg);
            this._onChanged();
        }

        processMessage  (message) {
            this.typeFilter.filter(message);
        }

        processInvite  (invite) {
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

        _processMessage  (message) {
            var tlConnection = message.metadata.tlConnection;
            if (this.contact.tlConnection === tlConnection) {
                message.sender = this.contact.name;
            }
            message.unread = true;
            this._pushMessage(message);
        }

        _pushMessage  (message) {
            message.time = new Date();
            //message.dialog = this;
            this.messages.push(message);
            if (message.unread) {
                this.unreadCount += 1;
            }
            this._onChanged();
        }

        markAsRead  () {
            if (this.unreadCount) {
                this.messages.forEach(function (msg) {
                    if (msg.unread) {
                        msg.unread = false;
                    }
                });
                this.unreadCount = 0;
                this._onChanged();
            }
        }
        hasSecureChannels  () {
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
            this.messages.forEach(function (msg, index) {
                delete msg.metadata;
                if (msg.unread) {
                    firstUnreadIndex = (firstUnreadIndex || firstUnreadIndex === 0) ? firstUnreadIndex : index;
                    lastUnreadIndex = index;
                }
            });
            packet.setData({
                _type_: "Dialog",
                name: this.name,
                unread: this.unreadCount,
                messages: this.unreadCount ? this.messages.slice(firstUnreadIndex, lastUnreadIndex + 1) : []
            });
            packet.setLink("contact", context.getPacket(this.contact));
        }
        deserialize  (packet, context) {
            this.checkFactory();
            var data = packet.getData();
            var factory = this.getFactory();
            this.name = data.name;
            this.unreadCount = data.unread;
            this.messages = data.messages || [];
            var contact = context.deserialize(packet.getLink("contact"), factory.createContact, factory);
            // true = skip firing change event
            this.setContact(contact, true);
        }

        _onMessage  (message) {
            if (this.contact) {
                this.contact.tlConnection.sendMessage(message);
            }
        }
    };

extend(Dialog.prototype, serializable);
