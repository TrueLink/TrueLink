    "use strict";
    import invariant = require("../../../modules/invariant");
    import zepto = require("zepto");var extend = zepto.extend;
    import eventEmitter = require("../../../modules/events/eventEmitter");
    import serializable = require("../../../modules/serialization/serializable");
    import model = require("../../mixins/model");

    import PageModel = require("./PageModel");
    import Profiles = require("../../models/Profile");

    function GroupChatPageModel() {
        this.accepts = Profile.GroupChat;
        this._defineEvent("changed");
    }

    GroupChatPageModel.prototype = new PageModel();

    extend(GroupChatPageModel.prototype, eventEmitter, serializable, model, {
        constructor: GroupChatPageModel,
        serialize: function (packet, context) {
            packet.setData({
                addContact: this.addContact
            });
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this["addContact"] = data.addContact;
            this._deserializeModel(packet, context);
        }

    });

    export = GroupChatPageModel;
