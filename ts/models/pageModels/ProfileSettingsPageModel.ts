    "use strict";
    import invariant = require("../modules/invariant");
    import extend = require("tools/extend");
    import eventEmitter = require("../modules/events/eventEmitter");
    import serializable = require("../modules/serialization/serializable");
    import model = require("mixins/model");

    import PageModel = require("./PageModel");
    import Profile = require("models/Profile");

    function ProfileSettingsPageModel() {
        this.accepts = Profile.Profile;
        this._defineEvent("changed");
    }

    ProfileSettingsPageModel.prototype = new PageModel();

    extend(ProfileSettingsPageModel.prototype, eventEmitter, serializable, model, {
        constructor: ProfileSettingsPageModel,
        serialize: function (packet, context) {
            packet.setData({
                mode: this.mode
            });
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this.mode = data.mode;
            this._deserializeModel(packet, context);
        }

    });

    export = ProfileSettingsPageModel;
