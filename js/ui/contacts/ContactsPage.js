define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "ContactsPage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var model = this.props.model;
            return {
                profile: model
            };
        },
        addContact: function () {
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
        _appendContactComponent: function (components, contact) {
            components[contact.name] = React.DOM.div({className: "generic-block"}, contact.name);
        },
        render: function () {
            var profile = this.state.profile;
            var router = this.props.router;
            var contacts = {};
            profile.contacts.forEach(this._appendContactComponent.bind(this, contacts));
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
                            onClick: this.addContact
                        }, "Add contact")),
                    contacts
                    ));
        }
    });
});