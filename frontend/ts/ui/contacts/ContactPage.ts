    "use strict";
    import React = require("react");
    import ReactBootstrap = require("react-bootstrap");
    import reactObserver = require("../../mixins/reactObserver");
    import TlConnectionStatus = require("./TlConnectionStatus");
    import EditableField = require("../../ui/common/EditableField");
    var exp = React.createClass({
        displayName: "ContactPage",
        mixins: [reactObserver],

        componentDidMount: function () {
            var contact = this.props.pageModel.model;
            contact.tlConnection.on("changed", this._onModelChanged, this);
        },
        componentWillUnmount: function () {
            var contact = this.props.pageModel.model;
            contact.tlConnection.off("changed", this._onModelChanged, this);
        },
        handleGoToDialog: function () {
            var contact = this.props.pageModel.model;
            var dialog = contact.profile.startDirectDialog(contact);
            this.props.router.navigate("dialog", dialog);
            return false;
        },
        rename: function(name){
            var contact = this.state.model;
            contact.set("name", name);
            var dialog = contact.profile.startDirectDialog(contact);
            dialog.set("name", name);
        },
//        handleModelChange: function (fieldName, newValue) {
//            this.props.pageModel.model.set(fieldName, newValue);
//        },
        render: function () {
            var contact = this.state.model;
//            var pageModel = this.state.pageModel;
            var router = this.props.router;

            return React.DOM.div({className: "contact-page app-page"},
                React.DOM.div({className: "app-page-header"},
                    React.DOM.span({className: "header-dropdown-menu-button"},
                        ReactBootstrap.DropdownButton({
                                title: "∴",
                                pullRight: true,
                                onSelect: function () {} // menu does not close on item click without this
                            },
                            ReactBootstrap.MenuItem({
                                id: "contact-go-to-dialog-button",
                                onClick: this.handleGoToDialog
                            }, "Go to dialog"),
                            ReactBootstrap.MenuItem({
                                onClick: function () {/* stub */}
                            }, "(stub) Add channel"),
                            ReactBootstrap.MenuItem({
                                onClick: function () {/* stub */}
                            }, "(stub) Comment"),
                            ReactBootstrap.MenuItem({
                                onClick: function () {/* stub */}
                            }, "(stub) Delete"))),
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("contacts", contact.profile)
                    }, "〈 Contact details")),
                React.DOM.div({className: "app-page-content has-header"},
                    EditableField({
                        id: "contactName",
                        onChanged: this.rename,
                        label: "Name: ",
                        value: contact.name
                    }),
                    TlConnectionStatus({tlConnection: contact.tlConnection}),
                    React.DOM.a({className: "button", href: "", onClick: this.handleGoToDialog}, "Go to dialog")));
        }
    });
export = exp;
