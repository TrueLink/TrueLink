define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var CouchAdapter = require("models/tlConnection/CouchAdapter");

    function GroupChat() {
        this._defineEvent("changed");

        console.log("Constructing GroupChat...");
        this.profile = null;
        this.grConnection = null;
        this.name = null;
        this.messages = [];
        this.adapter = null;
        this.since = 0;
        this.unreadCount = 0;
    }

    extend(GroupChat.prototype, eventEmitter, serializable, model, {
        setProfile: function (profile) {
            this.profile = profile;
        },

        init: function (args) {
            invariant(args.name, "Can i haz args.name?");
            invariant(args.grConnection, "Can i haz args.grConnection?");
            
            this.name = args.name;
            this.grConnection = args.grConnection;
            this._setTlgrEventHandlers();
            this._onChanged();
        },

        _handleUserJoined: function (user) {
            if (user === this.grConnection.getMyAid()) {
                this._pushMessage({
                    text: "You have joined a chat",
                    sender: "system"
                });
            } else {
                this._pushMessage({
                    text: "user_"  + user + " joined this chat",
                    sender: "system"
                });
            }
        },

        _handleUserLeft: function (user) {
            if (user === this.grConnection.getMyAid()) {
                //probably won't see this
                this._pushMessage({
                    text: "You have left this chat",
                    sender: "system"
                });
            } else {
                this._pushMessage({
                    text: "user_"  + user + " has left this chat",
                    sender: "system"
                });
            }
        },

        _setTlgrEventHandlers: function () {
            this.grConnection.on("message", this.processMessage, this);
            this.grConnection.on("user_joined", this._handleUserJoined, this);
            this.grConnection.on("user_left", this._handleUserLeft, this);
        },

        sendMessage: function (message) {
            var msg = {
                text: message,
                sender: "user" + this.grConnection.getMyAid()
            }
            msg.isMine = true;
            this._pushMessage(msg);
            if (this.grConnection) {
                this.grConnection.sendMessage(message);
            }
        },

        destroy: function () {
            this.grConnection.destroy();
        },

        processMessage: function (message) {
            message.isMine = false;
            this._pushMessage(message);
        },

        _pushMessage: function (message) {
            message.time = new Date();
            this.messages.push(message);
            if (message.unread) {
                this.unreadCount += 1;
            }
            this._onChanged();
        },

        markAsRead: function () {
            if (this.unreadCount) {
                this.messages.forEach(function (msg) {
                    if (msg.unread) {
                        msg.unread = false;
                    }
                });
                this.unreadCount = 0;
                this._onChanged();
            }
        },

        serialize: function (packet, context) {
            packet.setData({
                _type_: "GroupChat",
                name: this.name,
            });
            packet.setLink("grConnection", context.getPacket(this.grConnection));
        },

        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            this.name = packet.getData().name;
            this.grConnection = context.deserialize(packet.getLink("grConnection"), factory.createTlgr, factory);
            this._setTlgrEventHandlers();
        }

    });

    module.exports = GroupChat;
});
