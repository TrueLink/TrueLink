define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var model = require("mixins/model");
    var urandom = require("urandom");

    function Profile(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");

        this.bg = null;
        this.documents = [];
        this.contacts = [];
        this.dialogs = [];
    }

    extend(Profile.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {
            //console.log("serializing Profile");
            packet.setData({
                name: this.name,
                bg: this.bg
            });
            packet.setLink("documents", context.getPacket(this.documents));
        },
        deserialize: function (packet, context) {
            //console.log("deserializing Profile");
            var factory = this.factory;
            var data = packet.getData();
            this.name = data.name;
            this.bg = data.bg;
            this.documents = context.deserialize(packet.getLink("documents"), factory.createProfile.bind(factory));

        },
        createDocument: function () {
            var document = this.factory.createDocument();
            document.set("name", urandom.animal());
            this.documents.push(document);
            this.onChanged();
            return document;
        }
    });

    module.exports = Profile;
});