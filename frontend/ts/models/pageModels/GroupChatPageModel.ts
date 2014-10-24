    "use strict";
    import modules = require("modules");
    var invariant = modules.invariant;
    import extend = require("../../tools/extend");
    var eventEmitter = modules.events.eventEmitter;
    var serializable = modules.serialization.serializable;
    import model = require("../../mixins/model");

    import PageModel = require("./PageModel");
    import Profile = require("../../models/Profile");

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
