    "use strict";
    import invariant = require("../modules/invariant");
    import extend = require("tools/extend");
    import eventEmitter = require("../modules/events/eventEmitter");
    import serializable = require("../modules/serialization/serializable");
    import model = require("mixins/model");


    function Document() {
        this._defineEvent("changed");
        this.profile = null;
        this.name = null;
        this.fields = {};
    }

    extend(Document.prototype, eventEmitter, serializable, model, {
        init: function (args) {
            invariant(args.name, "Can i haz args.name?");
            this.name = args.name;
            this._onChanged();
        },
        setProfile: function (profile) {
            this.profile = profile;
        },
        serialize: function (packet, context) {
            packet.setData({
                name: this.name,
                fields: this.fields
            });
        },
        deserialize: function (packet, context) {
            this.checkFactory();
            var data = packet.getData();
            this.name = data.name;
            this.fields = data.fields;
        },
        setField: function (name, value) {
            if (this[name] === value) { return; }
            this[name] = value;
            this._onChanged();
        },
        getFields: function () { return this.fields; }

    });

    export = Document;
