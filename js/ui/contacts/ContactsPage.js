define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "ContactsPage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var pageModel = this.props.model;
            var model = pageModel.model;
            return {
                profile: model
            };
        },
        handleAddDialog: function () {

            try {
                var contact = this.props.model.model.createContact();
            } catch (ex) {
                console.error(ex);
            }
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
        handleContactClick: function (contact) {
            this.props.router.navigate("contact", contact);
            //var dialog = this.props.model.startDirectDialog(contact);
            //this.props.router.navigate("dialog", dialog);
            return false;
        },
        _appendDialogComponent: function (components, contact) {
            components[contact.name] = React.DOM.div({
                    className: "generic-block contact clearfix",
                    onClick: this.handleContactClick.bind(this, contact)
                },
                React.DOM.div({className: "contact-image"}, ""),
                React.DOM.div({className: "contact-title"}, contact.name));
        },
        render: function () {
            var profile = this.state.profile;
            var router = this.props.router;
            var contacts = {};
            profile.contacts.forEach(this._appendDialogComponent.bind(this, contacts));
            return React.DOM.div({className: "contacts-page"},
                React.DOM.div({className: "app-page-title"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("home", profile.app)
                    }, "Contacts")),
                React.DOM.div({className: "app-page-content"},
                    React.DOM.div({className: "generic-block"},
                        React.DOM.a({
                            className: "button",
                            href: "",
                            onClick: this.handleAddDialog
                        }, "Add contact")),
                    contacts
                    ));
        }
    });
});