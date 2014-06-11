define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    var reactObserver = require("mixins/reactObserver");
    module.exports = React.createClass({
        displayName: "DocumentsPage",
        mixins: [reactObserver],
        _appendDocComponent: function (components, document) {
            components[document.name] = React.DOM.div({className: "generic-block"}, document.name);
        },
        addDocument: function () {
            //var doc = this.props.pageModel.model.createDocument();
            //this.props.router
            return false;
        },
        render: function () {
            var profile = this.state.model;
            var router = this.props.router;
            var documents = {};
            profile.documents.forEach(this._appendDocComponent.bind(this, documents));
            return React.DOM.div({className: "documents-page"},
                React.DOM.div({className: "app-page-title"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("home", profile.app)
                    }, "Documents")),
                React.DOM.div({className: "app-page-content"},
                    React.DOM.div({className: "generic-block"},
                        React.DOM.a({
                            className: "button",
                            href: "",
                            onClick: this.addDocument
                        }, "Add document")),
                    documents
                    ));
        }
    });
});