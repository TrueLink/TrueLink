    "use strict";
    var invariant = require("modules/invariant");
    import extend = require("tools/extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    import model = require("mixins/model");

    import HomePage = require("ui/home/HomePage");
    import HomePageModel = require("models/pageModels/HomePageModel");
    import ContactsPage = require("ui/contacts/ContactsPage");
    import ContactPage = require("ui/contacts/ContactPage");
    import ContactsPageModel = require("models/pageModels/ContactsPageModel");
    import ContactPageModel = require("models/pageModels/ContactPageModel");
    import DialogsPage = require("ui/dialogs/DialogsPage");
    import GroupChatPage = require("ui/dialogs/GroupChatPage");
    import DialogsPageModel = require("models/pageModels/DialogsPageModel");
    import GroupChatPageModel = require("models/pageModels/GroupChatPageModel");
    import DialogPage = require("ui/dialogs/DialogPage");
    import DialogPageModel = require("models/pageModels/DialogPageModel");
    import DocumentsPage = require("ui/documents/DocumentsPage");
    import DocumentsPageModel = require("models/pageModels/DocumentsPageModel");

    var pages = {
        "home": {
            view: HomePage,
            model: HomePageModel
        },
        "contacts": {
            view: ContactsPage,
            model: ContactsPageModel
        },

        "contact": {
            view: ContactPage,
            model: ContactPageModel
        },

        "dialogs": {
            view: DialogsPage,
            model: DialogsPageModel
        },

        "dialog": {
            view: DialogPage,
            model: DialogPageModel
        },
        "groupChat": {
            view: GroupChatPage,
            model: GroupChatPageModel
        },
        "documents": {
            view: DocumentsPage,
            model: DocumentsPageModel
        }

//        "document": {
//            view: DocumentPage,
//            model: DocumentPageModel
//        }
    };

    function Router() {
        this._defineEvent("changed");
        this.currentPage = null;
        this.currentPageName = null;
        this.currentPageModel = null;
    }

    extend(Router.prototype, eventEmitter, serializable, model, {

        serialize: function (packet, context) {
            packet.setData({
                pageName: this.currentPageName
            });
            if (this.currentPageModel) {
                packet.setData({
                    modelType: this._factory.getTypeData(this.currentPageModel)
                });
            }
            packet.setLink("pageModel", context.getPacket(this.currentPageModel));
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this.currentPageName = data.pageName;
            var factory = this._factory;

            var modelConstructor = factory.getConstructor(data.modelType);
            this.currentPageModel = context.deserialize(packet.getLink("pageModel"), modelConstructor, factory);
            this.currentPage = this._createPageView(this.currentPageName, this.currentPageModel);
        },

        navigate: function (pageName, model) {
            try {
                if (this.currentPageName === pageName && this.currentPageModel && this.currentPageModel.model === model) {
                    return;
                }
                this.currentPageModel = this._createPageModel(pageName, model);
                this.currentPage = this._createPageView(pageName, this.currentPageModel);
                this.currentPageName = pageName;
                this._onChanged();
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
            return constructors.view({pageModel: pageModel, router: this});
        },

        _createPageModel: function (pageName, model) {
            var constructors = pages[pageName];
            invariant(constructors, "Page %s is not registered", pageName);
            var pageModel = this._factory.construct(constructors.model);
            pageModel.setModel(model);
            return pageModel;
        }
    });

    export = Router;
