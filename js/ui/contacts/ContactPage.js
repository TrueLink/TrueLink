define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    var reactObserver = require("mixins/reactObserver");
    var TlConnectionStatus = require("./TlConnectionStatus");
    module.exports = React.createClass({
        displayName: "ContactPage",
        mixins: [reactObserver],

        _componentDidMount: function () {
            var contact = this.props.pageModel.model;
            contact.tlConnection.on("changed", this._onModelChanged, this);
        },
        _componentWillUnmount: function () {
            var contact = this.props.pageModel.model;
            contact.tlConnection.off("changed", this._onModelChanged, this);
        },
        handleGoToDialog: function () {
            var contact = this.props.pageModel.model;
            var dialog = contact.profile.startDirectDialog(contact);
            this.props.router.navigate("dialog", dialog);
            return false;
        },
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
                    }, "〈 Contact details: " + contact.name)),
                React.DOM.div({className: "app-page-content has-header"},
                     TlConnectionStatus({tlConnection: contact.tlConnection}),
                     React.DOM.a({className: "button", href: "", onClick: this.handleGoToDialog}, "Go to dialog")));
        }
    });
});