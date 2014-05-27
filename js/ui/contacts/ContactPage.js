define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "ContactPage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var model = this.props.model;
            return {
                contact: model
            };
        },
        handleAddDialog: function () {
            var contact = this.props.model.createContact();
            //this.props.router
            return false;
        },
        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () {
            this.props.model.on("changed", this._onModelChanged, this);
        },
        componentWillUnmount: function () {
            this.props.model.off("changed", this._onModelChanged, this);
        },

        render: function () {
            var contact = this.state.contact;
            var router = this.props.router;
            return React.DOM.div({className: "contact-page"},
                React.DOM.div({className: "app-page-title"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("contacts", contact.profile)
                    }, "Contact details")),
                React.DOM.div({className: "app-page-content"},
                    contact.name
                    ));
        }
    });
});