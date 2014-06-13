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
        render: function () {
            var contact = this.state.model;
//            var pageModel = this.state.pageModel;
            var router = this.props.router;

            return React.DOM.div({className: "contact-page"},
                React.DOM.div({className: "app-page-title"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("contacts", contact.profile)
                    }, "Contact details: " + contact.name)),
                    TlConnectionStatus({tlConnection: contact.tlConnection}));
        }
    });
});