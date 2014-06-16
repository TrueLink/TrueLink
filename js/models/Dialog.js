define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var TypeFilter = require("models/filters/TypeFilter");

    function Dialog() {
        this._defineEvent("changed");

        this.profile = null;
        this.name = null;
        this.messages = [];
        this.contacts = [];

        this.typeFilter = new TypeFilter("receiver", "dialog");
        this.tlConnectionsFilter = null;
    }

    extend(Dialog.prototype, eventEmitter, serializable, model, {
        setProfile: function (profile) {
            this.profile = profile;
        },
        init: function () {
            this.tlConnectionsFilter = this._factory.createTlConnectionFilter();
            this._link();
        },
        addContact: function (contact) {
            invariant(this.tlConnectionsFilter, "dialog is not ready. Ensure to call init() before addContact()");
            console.log("__dialog added contact");
            this.contacts.push(contact);
            var contactTlConnection = contact.tlConnection;
            this.tlConnectionsFilter.addTlConnection(contactTlConnection);
            this._linkTlConnection(contactTlConnection);
        },

        sendMessage: function (message) {
            invariant(this.tlConnectionsFilter, "dialog is not ready");
            var msg = {text: message};
            this.messages.push(msg);
            this.tlConnectionsFilter.unfilter(msg);
            this._onChanged();
        },

        _processMessage: function (message) {
            console.log(this.name, "received message", message);
            this.messages.push(message);
            this._onChanged();
        },

        serialize: function (packet, context) {
            packet.setData({
                name: this.name,
                fields: this.fields
            });
            packet.setLink("contacts", context.getPacket(this.contacts));
            packet.setLink("tlConnectionsFilter", context.getPacket(this.tlConnectionsFilter));
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var data = packet.getData();
            var factory = this._factory;
            this.name = data.name;
            this.fields = data.fields;
            this.contacts = context.deserialize(packet.getLink("contacts"), factory.createTlConnectionFilter, factory);
            this.tlConnectionsFilter = context.deserialize(packet.getLink("tlConnectionsFilter"), factory.createTlConnectionFilter, factory);
            this._link();
        },

        _link: function () {
            if (this.typeFilter && this.tlConnectionsFilter) {
                this.typeFilter.on("filtered", this.tlConnectionsFilter.filter, this.tlConnectionsFilter);
                this.tlConnectionsFilter.on("filtered", this._processMessage, this);
                this.tlConnectionsFilter.on("unfiltered", this.typeFilter.unfilter, this.typeFilter);
                this.typeFilter.on("unfiltered", this._onMessage, this);
                this.contacts.forEach(function (contact) {
                    contact.tlConnection.on("message", this.typeFilter.filter, this.typeFilter);
                }, this);
            }
        },
        _onMessage: function (message) {
            console.log(this.name, "sends message", message);
            function sendMessage(conn) {
                conn.sendMessage(message);
            }
            message.metadata.tlConnection.forEach(sendMessage);
        },

        _linkTlConnection: function (conn) {
            conn.on("message", this.typeFilter.filter, this.typeFilter);
        }

    });

    module.exports = Dialog;
});