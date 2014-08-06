define(function(require, exports, module) {
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
        this.tlgr = null;
        this.name = null;
        this.messages = [];
        this.adapter = null;
        this.since = 0;
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
            this._setTlgrEventHandlers();
            this._onChanged();
        },
        _handleUserJoined: function (user) {
            if (user === this.tlgr.getMyAid()) {
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
            if (user === this.tlgr.getMyAid()) {
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
        
        _handleOpenAddrIn: function (args) {
            console.log("Tlgr openAddrIn");
            var _couchAdapter = new CouchAdapter(this.profile.transport, {
                context: args.context,
                addr: args.addr,
                since: this.since
               //was pretty bad idea to do this->  since: this.transport.getSince()
            });
            this.adapter = _couchAdapter;
            _couchAdapter.on("packet", this.tlgr.onNetworkPacket, this.tlgr);
            _couchAdapter.on("changed", function (obj) {
                this.fire("changed", this);
            }, this);
            _couchAdapter.run();
        },

        _setTlgrEventHandlers: function () {
            this.tlgr.on("message", this.processMessage, this);
            this.tlgr.on("user_joined", this._handleUserJoined, this);
            this.tlgr.on("user_left", this._handleUserLeft, this);
            this.tlgr.on("openAddrIn", this._handleOpenAddrIn, this);
        },

        sendMessage: function (message) {
            var msg = {
                text: message,
                sender: "user" + this.tlgr.getMyAid()
            }
            msg.isMine = true;
            this._pushMessage(msg);
            if (this.tlgr) {
                this.tlgr.sendMessage(message);
            }
        },

        destroy: function () {
            if (this.adapter) {
                this.adapter.off("packet", this.tlgr.onNetworkPacket, this.tlgr);
                //this.adapter.off("changed");
                this.adapter.destroy();
                this.adapter = null;
            }
            if (this.tlgr) {
                this.tlgr.sendChannelAbandoned();
                //this.tlgr.off("message");
                //this.tlgr.off("user_joined");
                //this.tlgr.off("user_left");
                //this.tlgr.off("openAddrIn");
                this.tlgr = null;
            }
        },

        processMessage: function(message) {
            message.isMine = false;
            this._pushMessage(message);

        },

        _pushMessage: function(message) {
            message.time = new Date();
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
                name: this.name,
                since: (this.adapter)?(this.adapter._since):0
            })
            packet.setLink("tlgr", context.getPacket(this.tlgr));
        },

        deserialize: function(packet, context) {
            this.checkFactory();
            var factory = this._factory;
            this.name = packet.getData().name;
            this.since = packet.getData().since;
            this.tlgr = context.deserialize(packet.getLink("tlgr"), factory.createTlgr, factory);
            this._setTlgrEventHandlers();
        },

    });

    module.exports = GroupChat;
});
