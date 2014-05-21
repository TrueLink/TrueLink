define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var model = require("mixins/model");


    function Document(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");

        this.name = null;
        this.fields = {};
    }

    extend(Document.prototype, eventEmitter, serializable, model, {
        serialize: function (packet, context) {
            packet.setData({
                name: this.name,
                fields: this.fields
            });
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this.name = data.name;
            this.fields = data.fields;
        },
        setField: function (name, value) {
            if (this[name] === value) { return; }
            this[name] = value;
            this.onChanged();
        },
        getFields: function () { return this.fields; }

    });

    module.exports = Document;
});