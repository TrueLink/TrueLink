define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var pages = {
        "home": require("ui/home/HomePage"),
        "contacts" : require("ui/contacts/ContactsPage"),
        "dialogs" : require("ui/dialogs/DialogsPage"),
        "documents" : require("ui/documents/DocumentsPage"),
        "profile" : require("ui/profile/ProfilePage")
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
            //console.log("serialize Router");
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
            //console.log("deserialize Router");
            var data = packet.getData();
            this.currentPageName = data.pageName;
            var factory = this.factory;

            var modelConstructor = factory.getConstructor(data.modelType);
            this.currentPageModel = context.deserialize(packet.getLink("model"), modelConstructor.bind(factory));
            this.currentPage = this._createPage(this.currentPageName, this.currentPageModel);
        },

        navigate: function (pageName, pageModel) {
            try {
                if (this.currentPageName === pageName && this.currentPageModel === pageModel) {
                    return;
                }
                this.currentPage = this._createPage(pageName, pageModel);
                this.currentPageModel = pageModel;
                this.currentPageName = pageName;
                this.onChanged();
            } catch (ex) {
                console.error("Navigation failed:", ex);
            }
        },

        createNavigateHandler: function (pageName, pageModel) {
            var handler = function () {
                this.navigate(pageName, pageModel);
                return false;
            };
            return handler.bind(this);
        },

        _createPage: function (pageName, pageModel) {
            invariant(pages[pageName], "Page %s is not registered", pageName);
            return pages[pageName]({model: pageModel, router: this});
        }
    });

    module.exports = Router;
});