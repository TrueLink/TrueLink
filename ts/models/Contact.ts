    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var uuid = require("uuid");
    var model = require("mixins/model");
    var TypeFilter = require("models/filters/TypeFilter");

    function Contact() {
        this._defineEvent("changed");
        this._defineEvent("inviteReceived");
        this._defineEvent("inviteAccepted");
        this.name = null;
        this.profile = null;
        this.tlConnection = null;
        this.invites = {};

        this.tlgrFilter = new TypeFilter("type", "tlgr-invite");
        this.tlgrFilter.on("filtered", this._processTlgrInvite, this);
        this.tlgrFilter.on("unfiltered", this._sendMessage, this);
    }

    extend(Contact.prototype, eventEmitter, serializable, model, {
        init: function (args) {
            invariant(args.tlConnection, "Can i haz args.tlConnection?");
            invariant(args.name, "Can i haz args.name?");
            this.tlConnection = args.tlConnection;
            this.name = args.name;
            
            this._link();
            this._onChanged();
        },

        setProfile: function (profile) {
            this.profile = profile;
            window.profile = profile;
        },

        serialize: function (packet, context) {
            packet.setData({name: this.name});
            packet.setLink("tlConnection", context.getPacket(this.tlConnection));
        },

        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            var data = packet.getData();
            this.name = data.name;
            this.tlConnection = context.deserialize(packet.getLink("tlConnection"), factory.createTlConnection, factory);
            this._link();
        },

        _link: function () {
            this.tlConnection.on("message", this.processMessage, this);
        },

        processMessage: function (message) {
            this.tlgrFilter.filter(message);
        },

        _generateInviteId: function () {
            return uuid();
        },

        _processTlgrInvite: function (message) {
            var invite = {};
            invite.id = this._generateInviteId();
            invite.message = message;
            invite.contact = this;
            invite.metadata = message.metadata;
            message.contact = this;
            message.id = invite.id;
            this.invites[invite.id] = message;
            this._onChanged();
            this.fire("inviteReceived", invite);
        },

        acceptInvite: function (inviteId, displayName) {
            if (inviteId in this.invites) {
                this.fire("inviteAccepted", { 
                    invite: this.invites[inviteId],
                    displayName: displayName
                });
                delete this.invites[inviteId];
                this._onChanged();
            }
        },

        rejectInvite: function (inviteId) {
            if (inviteId in this.invites) {
                delete this.invites[inviteId];
                this._onChanged();
            }
        },

        sendTlgrInvite: function (message) {
            this.tlgrFilter.unfilter(message);
        },

        _sendMessage: function (message) {
            this.tlConnection.sendMessage(message);
        }
    });

    export = Contact;
