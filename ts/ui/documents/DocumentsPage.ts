    "use strict";
    import React = require("react");
    import reactObserver = require("mixins/reactObserver");
    var exp = React.createClass({
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
            return React.DOM.div({className: "documents-page app-page"},
                React.DOM.div({className: "app-page-header"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("home", profile.app)
                    }, "〈 Documents")),
                React.DOM.div({className: "app-page-content has-header"},
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
export = exp;
