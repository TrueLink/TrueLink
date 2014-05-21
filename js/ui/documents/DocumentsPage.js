define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "DocumentsPage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var model = this.props.model;
            return {
                profile: model
            };
        },
        addDocument: function () {
            var doc = this.props.model.createDocument();
            //this.props.router
            return false;
        },
        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () { this.props.model.on("changed", this._onModelChanged, this); },
        componentWillUnmount: function () { this.props.model.off("changed", this._onModelChanged); },
        _appendDocComponent: function (components, document) {
            components[document.name] = React.DOM.div({className: "generic-block"}, document.name);
        },
        render: function () {
            var profile = this.state.profile;
            var documents = {};
            profile.documents.forEach(this._appendDocComponent.bind(this, documents));
            return React.DOM.div({className: "documents-page"},
                React.DOM.div({className: "app-page-title"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: function () {}
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

            // React.DOM.div(null, "Documents: " + this.state.profile.name);
        }
    });
});