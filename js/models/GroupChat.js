define(function(require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    function GroupChat() {
        this._defineEvent("changed");

        this.profile = null;
        this.tlgr = null;
        this.name = null;
        this.messages = [];
        this.unreadCount = 0;
    }

    extend(GroupChat.prototype, eventEmitter, serializable, model, {
        setProfile: function(profile) {
            this.profile = profile;
        },

        init: function(args) {
            invariant(args.name, "Can i haz args.name?");
            invariant(args.tlgr, "Can i haz args.tlgr?");
            
            this.name = args.name;
            this.tlgr = args.tlgr;
            
            this._onChanged();
        },

        sendMessage: function(message) {
        },

        processMessage: function(message) {
        },

        _pushMessage: function(message) {
            message.time = new Date();
            message.dialog = this;
            this.messages.push(message);
            if (message.unread) {
                this.unreadCount += 1;
            }
            this._onChanged();
        },

        markAsRead: function() {
            if (this.unreadCount) {
                this.messages.forEach(function(msg) {
                    if (msg.unread) {
                        msg.unread = false;
                    }
                });
                this.unreadCount = 0;
                this._onChanged();
            }
        },

        serialize: function(packet, context) {
            packet.setData({
                _type_: "GroupChat",
                name: this.name
            })
            packet.setLink("tlgr", context.getPacket(this.tlgr));
        },

        deserialize: function(packet, context) {
            this.checkFactory();
            var factory = this._factory;
            this.name = packet.getData().name;
            this.tlgr = context.deserialize(packet.getLink("tlgr"), factory.createTlgr, factory);
        },

    });

    module.exports = GroupChat;
});
