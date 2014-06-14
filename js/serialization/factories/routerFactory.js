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

    function RouterFactory(serializer, router) {
        invariant(serializer, "Can i haz serializer?");
        invariant(router, "Can i haz router?");
        this.serializer = serializer;
        this.resolver = new Dictionary();
        this.resolver.item(0, HomePageModel);
        this.resolver.item(1, ContactsPageModel);
        this.resolver.item(2, ContactPageModel);
        this.resolver.item(3, DialogsPageModel);
        this.resolver.item(4, DialogPageModel);
        this.resolver.item(5, DocumentsPageModel);
        this.resolver.item(6, DocumentPageModel);
        this.router = router;
    }

    extend(RouterFactory.prototype, prototype, {
        getConstructor: function (typeData) {
            var constructor = this.resolver.item(typeData);
            invariant(constructor, "Type with data %s is not registered", typeData);
            // will be bound inside parent caller's deserialization method
            return function () { return this._observed(new constructor(this)); };
        },

        getTypeData: function (inst) {
            var found = this.resolver.first(function (item) { return item.value === inst.constructor; });
            invariant(found, "Type is not registered");
            return found.key;
        },

        construct: function (Constructor) {
            return this._observed(new Constructor(this.serializer.getRetardedFactory()));
        }

    });

    module.exports = RouterFactory;
});