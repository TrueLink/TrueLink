    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import Event = require("tools/event");
    import serializable = require("modules/serialization/serializable");
    import Profile = require("models/Profile");
    import Contact = require("models/Contact");
    import Model = require("tools/model");

    export class Dialog extends Model.Model implements ISerializable {
        public profile : Profile.Profile;
        public name : string;
        public messages : Array<IUserMessage>;
        public contact : Contact.Contact;
        public unreadCount : number;

        constructor () {

            super();
        this.profile = null;
        this.name = null;
        this.messages = [];
        this.contact = null;
        this.unreadCount = 0;

    }

        setProfile  (profile: Profile.Profile) {
            this.profile = profile;
        }

        init  (args) {
            invariant(args.name, "Can i haz args.name?");
            this.name = args.name;
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

    };

extend(Dialog.prototype, serializable);
