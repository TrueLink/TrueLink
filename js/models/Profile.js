define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var urandom = require("modules/urandom/urandom");

    function Profile(factory, app) {
        invariant(factory, "Can be constructed only with factory");
        invariant(app, "Can i haz app?");
        this.factory = factory;
        this._defineEvent("changed");

        this.app = app;
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
            this.documents = context.deserialize(packet.getLink("documents"), factory.createDocument.bind(factory));

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