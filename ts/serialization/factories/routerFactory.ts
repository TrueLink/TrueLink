    "use strict";
    var invariant = require("modules/invariant");
    var Dictionary = require("modules/dictionary/dictionary");
    import extend = require("tools/extend");
    import prototype = require("./prototype");

    import HomePageModel = require("models/pageModels/HomePageModel");
    import ContactsPageModel = require("models/pageModels/ContactsPageModel");
    import ContactPageModel = require("models/pageModels/ContactPageModel");
    import DialogsPageModel = require("models/pageModels/DialogsPageModel");
    import DialogPageModel = require("models/pageModels/DialogPageModel");
    import GroupChatPageModel = require("models/pageModels/GroupChatPageModel");
    import DocumentsPageModel = require("models/pageModels/DocumentsPageModel");
    import DocumentPageModel = require("models/pageModels/DocumentPageModel");

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
        this.resolver.item(7, GroupChatPageModel);

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
            return this._observed(new Constructor());
        }

    });

    export = RouterFactory;
