define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var model = require("mixins/model");

    var pages = {
        "home": require("ui/home/HomePage"),
        "home2": require("ui/home/HomePage2"),
        "contacts" : require("ui/contacts/ContactsPage"),
        "dialogs" : require("ui/dialogs/DialogsPage"),
        "documents" : require("ui/documents/DocumentsPage")
    };

    function Router(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");
        this.currentPage = null;
        this.currentPageName = null;
        this.currentPageModel = null;
    }

    extend(Router.prototype, eventEmitter, serializable, model, {

        serialize: function (packet, context) {
            console.log("serialize Router");
            packet.setData({
                pageName: this.currentPageName
            });
            if (this.currentPageModel) {
                packet.setData({
                    modelType: this.factory.getTypeData(this.currentPageModel)
                });
            }
            packet.setLink("model", context.getPacket(this.currentPageModel));
        },
        deserialize: function (packet, context) {
            console.log("deserialize Router");
            var data = packet.getData();
            this.currentPageName = data.pageName;

            if (data.modelType !== undefined) {
                var factory = this.factory;
                var constructor = factory.getConstructor(data.modelType);
                this.currentPageModel = context.deserialize(packet.getLink("model"), constructor.bind(factory));
                this.currentPage = this.createPage(this.currentPageName, this.currentPageModel);
            }
        },
        navigate: function (pageName, pageModel) {
            if (this.currentPageName === pageName && this.currentPageModel === pageModel) { return; }
            this.currentPage = this.createPage(pageName, pageModel);
            this.currentPageModel = pageModel;
            this.currentPageName = pageName;
            this.onChanged();
        },

        createNavigateHandler: function (pageName, pageModel) {
            var handler = function () {
                this.navigate(pageName, pageModel);
                return false;
            };
            return handler.bind(this);
        },

        createPage: function (pageName, pageModel) {
            invariant(pages[pageName], "Page %s is not registered", pageName);
            return pages[pageName]({model: pageModel, router: this});
        }
    });

    module.exports = Router;
});