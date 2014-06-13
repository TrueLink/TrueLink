define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    var Hex = require("modules/multivalue/hex");
    var reactObserver = require("mixins/reactObserver");
    module.exports = React.createClass({
        displayName: "ContactPage",
        mixins: [reactObserver],
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

            var tlConnectionState = contact.tlConnection.getStatus();
            var offer = contact.tlConnection.offer ? contact.tlConnection.offer.as(Hex).toString() : null;
            var auth =  contact.tlConnection.auth ? contact.tlConnection.auth.as(Hex).toString() : null;

            return React.DOM.div({className: "contact-page"},
                React.DOM.div({className: "app-page-title"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("contacts", contact.profile)
                    }, "Contact details")),
                React.DOM.div({className: "app-page-content"},
                    contact.name, " tl state: " + tlConnectionState,
                    React.DOM.div(null, "offer: " + offer),
                    React.DOM.div(null, "auth: " + auth),
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