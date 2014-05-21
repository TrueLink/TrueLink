define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var extend = require("extend");
    var eventEmitter = require("events/eventEmitter");
    var serializable = require("serialization/serializable");
    var model = require("mixins/model");

    var pages = {
        "home": require("ui/home/HomePage"),
        "contacts" : require("ui/contacts/ContactsPage"),
        "dialogs" : require("ui/dialogs/DialogsPage"),
        "documents" : require("ui/documents/DocumentsPage")
    };

    function Router(factory) {
        invariant(factory, "Can be constructed only with factory");
        this.factory = factory;
        this._defineEvent("changed");
        this.currentPage = null;
        this.defaultPageName = null;
        this.currentPageName = null;
        this.defaultPageModel = null;
        this.currentPageModel = null;
    }

    extend(Router.prototype, eventEmitter, serializable, model, {

        serialize: function (packet, context) {
            console.log("serialize Router");
            packet.setData({
                pageName: this.currentPageName,
                defaultPageName: this.defaultPageName
            });
            if (this.currentPageModel) {
                packet.setData({
                    modelType: this.factory.getTypeData(this.currentPageModel),
                    defaultModelType: this.factory.getTypeData(this.defaultPageModel)
                });
            }
            packet.setLink("model", context.getPacket(this.currentPageModel));
            packet.setLink("defaultModel", context.getPacket(this.defaultPageModel));
        },
        deserialize: function (packet, context) {
            console.log("deserialize Router");
            var data = packet.getData();
            this.currentPageName = data.pageName;
            this.defaultPageName = data.defaultPageName;
            var factory = this.factory;

            if (data.modelType !== undefined) {
                try {
                    var modelConstructor = factory.getConstructor(data.modelType);
                    this.currentPageModel = context.deserialize(packet.getLink("model"), modelConstructor.bind(factory));
                    this.currentPage = this._createPage(this.currentPageName, this.currentPageModel);
                } catch (ex) {
                    var defaultModelConstructor = factory.getConstructor(data.defaultModelType);
                    this.defaultPageModel = context.deserialize(packet.getLink("model"), defaultModelConstructor.bind(factory));
                    this.currentPage = this._createPage(this.defaultPageName, this.defaultPageModel);
                }
            }
        },

        setDefaultPage: function (pageName, pageModel) {
            this.defaultPageName = pageName;
            this.defaultPageModel = pageModel;

            if (!this.currentPage) {
                this.navigate(pageName, pageModel);
            } else {
                this.onChanged();
            }
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