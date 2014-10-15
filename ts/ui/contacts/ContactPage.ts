    "use strict";
    import React = require("react");
    import reactObserver = require("mixins/reactObserver");
    import TlConnectionStatus = require("./TlConnectionStatus");
    import EditableField = require("ui/common/EditableField");
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
