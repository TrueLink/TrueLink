define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var Dictionary = require("modules/dictionary/dictionary");
    var extend = require("extend");
    var prototype = require("./prototype");

    var HomePageModel = require("models/pageModels/HomePageModel");
    var ContactsPageModel = require("models/pageModels/ContactsPageModel");
    var ContactPageModel = require("models/pageModels/ContactPageModel");
    var DialogsPageModel = require("models/pageModels/DialogsPageModel");
    var DialogPageModel = require("models/pageModels/DialogPageModel");
    var DocumentsPageModel = require("models/pageModels/DocumentsPageModel");
    var DocumentPageModel = require("models/pageModels/DocumentPageModel");

    var Profile = require("models/Profile");
    var Contact = require("models/Contact");
    var Document = require("models/Document");
    var Dialog = require("models/Dialog");

    function RouterFactory(serializer) {
        invariant(serializer, "Can i haz serializer?");
        this.serializer = serializer;
        this.resolver = new Dictionary();
        this.resolver.item(0, HomePageModel);
        this.resolver.item(1, ContactsPageModel);
        this.resolver.item(2, ContactPageModel);
        this.resolver.item(3, DialogsPageModel);
        this.resolver.item(4, DialogPageModel);
        this.resolver.item(5, DocumentsPageModel);
        this.resolver.item(6, DocumentPageModel);
        this.router = null;
    }

    extend(RouterFactory.prototype, prototype, {
        setRouter: function (router) {
            this.router = router;
        },

        getConstructor: function (typeData) {
            invariant(this.resolver, "resolver is not defined");
            var constructor = this.resolver.item(typeData);
            invariant(constructor, "Type with data %s is not registered", typeData);
            // will be bound inside parent caller's deserialization method
            return function () { return this._observed(new constructor(this)); };
        },

        getTypeData: function (inst) {
            invariant(this.resolver, "resolver is not defined");
            var found = this.resolver.first(function (item) { return item.value === inst.constructor; });
            invariant(found, "Type is not registered");
            return found.key;
        },

        construct: function (Constructor) {
            return this._observed(new Constructor(this));
        },

        shoudBeDeserialized: function () {
            throw new Error("All needed instances must be deserialized before router deserialization");
        }

    });

    module.exports = RouterFactory;
});