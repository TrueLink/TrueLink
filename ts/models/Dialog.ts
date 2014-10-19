    "use strict";
    import invariant = require("../../modules/invariant");
    import extend = require("tools/extend");
    import Event = require("tools/event");
    import serializable = require("../../modules/serialization/serializable");
    import Profile = require("models/Profile");
    import Contact = require("models/Contact");
    import MessageHistory = require("models/MessageHistory");
    import Model = require("tools/model");
    import notifications = require("tools/notifications-api");

    export class Dialog extends Model.Model implements ISerializable {
        public profile : Profile.Profile;
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

        setProfile  (profile: Profile.Profile) {
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
                if (this.profile.notificationType === Profile.Profile.NOTIFICATION_COUNT) {
                    notifications.notify(this.name + " ( " + this.profile.name + " )", this.unreadCount + " unread messages.");
                } else if (this.profile.notificationType === Profile.Profile.NOTIFICATION_MESSAGE) {
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
