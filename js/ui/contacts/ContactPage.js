define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "ContactPage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var pageModel = this.props.model;
            var model = pageModel.model;

            return {
                contact: model,
                tlConnectionState: model.tlConnection.tlkeBuilder ?
                    model.tlConnection.tlkeBuilder.getTlkeState() : null
            };
        },

        handleGenerate: function () {
            try {
                this.props.model.model.tlConnection.generateOffer();
            } catch (ex) {
                this.handleAbort();
                console.error(ex);
            }
            return false;
        },

        handleAbort: function () {
            try {
                this.props.model.modeltlConnection.abortTlke();
            } catch (ex) {
                console.error(ex);
            }
            return false;
        },

        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () {
            var contact = this.props.model.model;
            contact.on("changed", this._onModelChanged, this);
            contact.tlConnection.on("changed", this._onModelChanged, this);
        },
        componentWillUnmount: function () {
            var contact = this.props.model.model;
            contact.off("changed", this._onModelChanged, this);
            contact.tlConnection.off("changed", this._onModelChanged, this);
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
                    contact.name, " tl state: " + this.state.tlConnectionState,
                    React.DOM.div(null, React.DOM.a({
                        href: "",
                        onClick: this.handleGenerate
                    }, "generate")), React.DOM.div(null, React.DOM.a({
                        href: "",
                        onClick: this.handleAbort
                    }, "abort"))
                    ));
        }
    });
});