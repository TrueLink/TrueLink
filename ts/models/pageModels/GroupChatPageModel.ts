    "use strict";
    var invariant = require("modules/invariant");
    import extend = require("tools/extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var PageModel = require("./PageModel");
    var GroupChat = require("models/GroupChat");

    function GroupChatPageModel() {
        this.accepts = GroupChat;
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
