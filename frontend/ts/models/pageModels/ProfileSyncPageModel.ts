"use strict";
import modules = require("modules");
import invariant = require("invariant");
import extend = require("../../tools/extend");
var eventEmitter = modules.events.eventEmitter;
var serializable = modules.serialization.serializable;
import model = require("../../mixins/model");

import PageModel = require("./PageModel");
import Profile = require("../../models/Profile");

function ProfileSyncPageModel() {
    this.accepts = Profile.Profile;
    this._defineEvent("changed");
}

ProfileSyncPageModel.prototype = new PageModel();

extend(ProfileSyncPageModel.prototype, eventEmitter, serializable, model, {
    constructor: ProfileSyncPageModel,
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

export = ProfileSyncPageModel;
