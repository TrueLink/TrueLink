define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");

    var HomePage = require("ui/home/HomePage");
    var HomePageModel = require("models/pages/HomePageModel");
    var ContactsPage = require("ui/contacts/ContactsPage");
    var ContactsPageModel = require("models/pages/ContactsPageModel");

    var pages = {
        "home": {
            view: HomePage,
            model: HomePageModel
        },
        "contacts": {
            view: ContactsPage,
            model: ContactsPageModel
        }
//        "contact" : require("ui/contacts/ContactPage"),
//        "dialogs" : require("ui/dialogs/DialogsPage"),
//        "documents" : require("ui/documents/DocumentsPage"),
//        "profile" : require("ui/profile/ProfilePage")
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
            this.currentPage = this._createPageView(this.currentPageName, this.currentPageModel);
        },

        navigate: function (pageName, model) {
            try {
                if (this.currentPageName === pageName && this.currentPageModel.model === model) {
                    return;
                }
                this.currentPageModel = this._createPageModel(pageName, model);
                this.currentPage = this._createPageView(pageName, this.currentPageModel);
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

        _createPageView: function (pageName, pageModel) {
            var constructors = pages[pageName];
            invariant(constructors, "Page %s is not registered", pageName);
            return constructors.view({model: pageModel, router: this});
        },

        _createPageModel: function (pageName, model) {
            var constructors = pages[pageName];
            invariant(constructors, "Page %s is not registered", pageName);
            var pageModel = this.factory.construct(constructors.model);
            pageModel.setModel(model);
            return pageModel;
        }
    });

    module.exports = Router;
});