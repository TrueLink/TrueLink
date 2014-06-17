define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    var reactObserver = require("mixins/reactObserver");
    module.exports = React.createClass({
        displayName: "ContactsPage",
        mixins: [reactObserver],
        handleAddContact: function () {
            try {
                var contact = this.props.pageModel.model.createContact();
//                this.props.router
            } catch (ex) {
                console.error(ex);
            }
            return false;
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
            var profile = this.state.model;
//            var pageModel = this.state.pageModel;
            var router = this.props.router;
            var contacts = {};
            profile.contacts.forEach(this._appendDialogComponent.bind(this, contacts));
            return React.DOM.div({className: "contacts-page app-page"},
                React.DOM.div({className: "app-page-header"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("home", profile.app)
                    }, "〈 Contacts")),
                React.DOM.div({className: "app-page-content has-header"},
                    React.DOM.div({className: "generic-block"},
                        React.DOM.a({
                            className: "button",
                            href: "",
                            onClick: this.handleAddContact
                        }, "Add contact")),
                    contacts
                    ));
        }
    });
});