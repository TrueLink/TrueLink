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
            this.name = args.name;
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
        },

        deserialize: function(packet, context) {
        },

    });

    module.exports = GroupChat;
});