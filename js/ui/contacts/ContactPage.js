define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    var Hex = require("modules/multivalue/hex");

    module.exports = React.createClass({
        displayName: "ContactPage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var pageModel = this.props.pageModel;
            var model = pageModel.model;
            return {
                contact: model,
                tlConnectionState: model.tlConnection ? model.tlConnection.status : null,
                offer: model.tlConnection && model.tlConnection.offer ? model.tlConnection.offer.as(Hex).toString() : null,
                auth: model.tlConnection && model.tlConnection.auth ? model.tlConnection.auth.as(Hex).toString() : null
            };
        },

        handleGenerate: function () {
            try {
                this.props.pageModel.model.tlConnection.generateOffer();
            } catch (ex) {
                this.handleAbort();
                console.error(ex);
            }
            return false;
        },

        handleAbort: function () {
            try {
                this.props.pageModel.model.tlConnection.abortTlke();
            } catch (ex) {
                console.error(ex);
            }
            return false;
        },

        handleOfferInput: function () {
            var offer = Hex.fromString(this.refs.offer.getDOMNode().value);
            this.props.pageModel.model.tlConnection.enterOffer(offer);
        },

        handleAuthInput: function () {
            var offer = Hex.fromString(this.refs.auth.getDOMNode().value);
            this.props.pageModel.model.tlConnection.enterAuth(offer);
        },

        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () {
            var contact = this.props.pageModel.model;
            contact.on("changed", this._onModelChanged, this);
            contact.tlConnection.on("changed", this._onModelChanged, this);
        },
        componentWillUnmount: function () {
            var contact = this.props.pageModel.model;
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
                    React.DOM.div(null, "offer: " + this.state.offer),
                    React.DOM.div(null, "auth: " + this.state.auth),
                    React.DOM.div(null, React.DOM.a({
                        href: "",
                        onClick: this.handleGenerate
                    }, "generate")),
                    React.DOM.div(null, React.DOM.a({
                        href: "",
                        onClick: this.handleAbort
                    }, "abort")),
                    React.DOM.div(null, React.DOM.input({ref: "offer"}), React.DOM.button({onClick: this.handleOfferInput}, "accept offer")),
                    React.DOM.div(null, React.DOM.input({ref: "auth"}), React.DOM.button({onClick: this.handleAuthInput}, "accept auth"))
                ));
        }
    });
});