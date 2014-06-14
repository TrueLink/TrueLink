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
        this._defineEvent("message");

        this.profile = null;
        this.name = null;
        this.messages = [];
        this.contacts = [];

        this.typeFilter = new TypeFilter("receiver", "dialog");
        this.tlConnectionsFilter = null;
    }

    extend(Dialog.prototype, eventEmitter, serializable, model, {
        init: function () {
//            this.tlConnectionsFilter =
        },
        addContact: function (contact) {
            this.contacts.push(contact);
            this.tlConnectionsFilter;
        },
        processMessage: function (message) {
            invariant(this.tlConnectionsFilter, "dialog is not ready");
            this.typeFilter.filter(message);
        },

        sendMessage: function (message) {
            invariant(this.tlConnectionsFilter, "dialog is not ready");
            this.tlConnectionsFilter.unfilter(message);
        },

        setProfile: function (profile) {
            this.profile = profile;
        },

        _processMessage: function (message) {

        },

        serialize: function (packet, context) {
            packet.setData({
                name: this.name,
                fields: this.fields
            });
            packet.setLink("contacts", context.getPacket(this.contacts));
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var data = packet.getData();
            var factory = this._factory;
            this.name = data.name;
            this.fields = data.fields;
            this.contacts = context.deserialize(packet.getLink("contacts"), factory.createContact.bind(factory, this));
        },

        link: function () {
            if (this.typeFilter && this.tlConnectionsFilter) {
                this.typeFilter.on("filtered", this.tlConnectionsFilter.filter, this.tlConnectionsFilter);
                this.tlConnectionsFilter.on("filtered", this._processMessage, this);
                this.tlConnectionsFilter.on("unfiltered", this.typeFilter.unfilter, this.typeFilter);
                this.typeFilter.on("unfiltered", this._onMessage, this);
            }
        },


        _onMessage: function (message) {
            this.fire("message", message);
        }


    });

    module.exports = Dialog;
});