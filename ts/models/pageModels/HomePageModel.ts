    "use strict";
    var invariant = require("modules/invariant");
    import extend = require("tools/extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var App = require("models/App");
    var PageModel = require("./PageModel");


    function HomePageModel() {
        this.accepts = App;
        this._defineEvent("changed");

    }

    HomePageModel.prototype = new PageModel();

    extend(HomePageModel.prototype, eventEmitter, serializable, model, {
        constructor: HomePageModel,
        serialize: function (packet, context) {
            this._serializeModel(packet, context);
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this._deserializeModel(packet, context);
        },

        setCurrentProfile: function (profile) {
            this.model.setCurrentProfile(profile);
        }

    });

    export = HomePageModel;
