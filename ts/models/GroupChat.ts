    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import Model = require("tools/model");
    import GrConnection = require("models/grConnection/GrConnection");
    import eventEmitter = require("modules/events/eventEmitter");
    import serializable = require("modules/serialization/serializable");
    import model = require("mixins/model");
    import CouchAdapter = require("models/tlConnection/CouchAdapter");
    import Profile = require("models/Profile");

    export class GroupChat extends Model.Model implements ISerializable {
        public profile : Profile.Profile;
        public grConnection : GrConnection.GrConnection;
        public name : string;
        
        private messages : Array<IUserMessage>;
        private unreadCount : number;
        
        constructor () {
            super();
            console.log("Constructing GroupChat...");
            this.profile = null;
            this.grConnection = null;
            this.name = null;
            this.messages = [];
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

        serialize  (packet, context) {
            packet.setData({
                _type_: "GroupChat",
                name: this.name,
            });
            packet.setLink("grConnection", context.getPacket(this.grConnection));
        }

        deserialize  (packet, context) {
            this.checkFactory();
            var factory = this.getFactory();
            this.name = packet.getData().name;
            this.grConnection = context.deserialize(packet.getLink("grConnection"), factory.createTlgr, factory);
            this._setTlgrEventHandlers();
        }

    }
extend(GroupChat.prototype, serializable);
