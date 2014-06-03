define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var App = require("models/App");
    var PageModel = require("./PageModel");


    function HomePageModel(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
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
            var factory = this.factory;
            var data = packet.getData();
            this._deserializeModel(packet, context);
        },

        setCurrentProfile: function (profile) {
            this.model.setCurrentProfile(profile);
        }

    });

    module.exports = HomePageModel;
});