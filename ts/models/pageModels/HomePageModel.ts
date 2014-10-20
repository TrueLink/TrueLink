    "use strict";
    import invariant = require("../../../modules/invariant");
    import zepto = require("zepto");var extend = zepto.extend;
    import eventEmitter = require("../../../modules/events/eventEmitter");
    import serializable = require("../../../modules/serialization/serializable");
    import model = require("../../mixins/model");

    import App = require("../../models/App");
    import PageModel = require("./PageModel");


    function HomePageModel() {
        this.accepts = App.Application;
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
