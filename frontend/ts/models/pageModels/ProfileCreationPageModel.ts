    "use strict";
    import invariant = require("../../../modules/invariant");
    import extend = require("../../tools/extend");
    import eventEmitter = require("../../../modules/events/eventEmitter");
    import serializable = require("../../../modules/serialization/serializable");
    import model = require("../../mixins/model");

    import PageModel = require("./PageModel");
    import Profile = require("../../models/Profile");

    function ProfileCreationPageModel() {
        this.accepts = Profile.Profile;
        this._defineEvent("changed");
    }

    ProfileCreationPageModel.prototype = new PageModel();

    extend(ProfileCreationPageModel.prototype, eventEmitter, serializable, model, {
        constructor: ProfileCreationPageModel,
        serialize: function (packet, context) {
            packet.setData({
            });
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this._deserializeModel(packet, context);
        }

    });

    export = ProfileCreationPageModel;
