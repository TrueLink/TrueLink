    "use strict";
    import modules = require("modules");
    import React = require("react");
    import Hex = require("Multivalue/multivalue/hex");
    import DecBlocks = require("Multivalue/multivalue/decBlocks");
    import Tlec = require("Tlec");
    var TlecBuilder = Tlec.Builder;
    
    var exp = React.createClass({
        displayName: "TlConnectionStatus",
        handleGenerate: function () {
            try {
                this.props.tlConnection.generateOffer();
            } catch (ex) {
                this.handleAbort();
                console.error(ex);
            }
            return false;
        },

        handleAbort: function () {
            try {
                this.props.tlConnection.abortTlke();
            } catch (ex) {
                console.error(ex);
            }
            return false;
        },

        focusTarget: function(event) {
            event.target.focus();
            event.target.select();
        },

        onFocusTarget: function(event) {
            event.target.focus();
            event.target.select();
            event.target.setSelectionRange(0, 9999); // iOS
        },

        handleOfferInput: function () {
            var offer = DecBlocks.fromString(this.refs.offer.getDOMNode().value);
            this.props.tlConnection.enterOffer(offer);
        },

        handleAuthInput: function () {
            var offer = DecBlocks.fromString(this.refs.auth.getDOMNode().value);
            this.props.tlConnection.enterAuth(offer);
        },
        render: function () {
            var tlConnection = this.props.tlConnection;
            var tlStatus = undefined;
            if (!tlConnection) {
                return React.DOM.div(null, "tlConnection is not set");
            }
            var offer = tlConnection.offer ? tlConnection.offer.as(DecBlocks).toString() : null;
            var auth =  tlConnection.auth ? tlConnection.auth.as(DecBlocks).toString() : null;
            var status = tlConnection.getStatus();
            switch (status) {
            case TlecBuilder.STATUS_NOT_STARTED:
                tlStatus = "Not connected";
                break;
            case TlecBuilder.STATUS_OFFER_GENERATED:
                tlStatus = "Offer provided";
                break;
            case TlecBuilder.STATUS_AUTH_GENERATED:
                tlStatus = "Offer and Auth provided";
                break;
            case TlecBuilder.STATUS_AUTH_ERROR:
                tlStatus = "Auth error";
                break;
            case TlecBuilder.STATUS_OFFERDATA_NEEDED:
                tlStatus = "Waiting for response (offer data)";
                break;
            case TlecBuilder.STATUS_AUTHDATA_NEEDED:
                tlStatus = "Waiting for response (auth data)";
                break;
            case TlecBuilder.STATUS_AUTH_NEEDED:
                tlStatus = "Auth needed";
                break;
            case TlecBuilder.STATUS_HT_EXCHANGE:
                tlStatus = "Hashtail exchange";
                break;
            case TlecBuilder.STATUS_ESTABLISHED:
                tlStatus = "Established";
                break;
            }

            var offerDisplay = status !== TlecBuilder.STATUS_OFFER_GENERATED ? null :
                    React.DOM.div(null,
                        React.DOM.label(null, "Offer:", React.DOM.br(), React.DOM.textarea({
                            id: "create-contact-offer-field",
                            onClick: this.focusTarget,
                            onFocus: this.onFocusTarget,
                            value: offer
                        })));
            var authDisplay = status !== TlecBuilder.STATUS_AUTH_GENERATED ? null :
                    React.DOM.div(null,
                        React.DOM.label(null, "Auth:", React.DOM.br(), React.DOM.input({
                            id: "create-contact-auth-field",
                            onClick: this.focusTarget,
                            onFocus: this.onFocusTarget,
                            value: auth
                        })));
            var generateButton = status !== TlecBuilder.STATUS_NOT_STARTED ? null :
                    React.DOM.div(null, React.DOM.button({
                        id: "generate-offer-button",
                        onClick: this.handleGenerate
                    }, "Generate offer"));
            var abortButton = generateButton ? null :
                    React.DOM.div(null, React.DOM.button({
                        onClick: this.handleAbort
                    }, "Abort connection"));
            var offerInput = status !== TlecBuilder.STATUS_NOT_STARTED ? null :
                    React.DOM.div(null,
                        React.DOM.label(null, "Offer:", React.DOM.br(),
                            React.DOM.input({
                                id: "create-contact-offer-field",
                                ref: "offer"
                            })),
                        React.DOM.div(null, React.DOM.button({
                            id: "create-contact-accept-offer-button",
                            onClick: this.handleOfferInput
                        }, "Accept offer")));
            var authInput = status !== TlecBuilder.STATUS_AUTH_NEEDED ? null :
                    React.DOM.div(null,
                        React.DOM.label(null,
                            React.DOM.input({
                                id: "create-contact-auth-field",
                                ref: "auth"
                                })),
                        React.DOM.div(null, React.DOM.button({
                            id: "create-contact-accept-auth-button",
                            onClick: this.handleAuthInput
                        }, "Accept auth")));

            return React.DOM.div({className: "tlStatus"},
                "Status: " + tlStatus,
                offerDisplay, authDisplay, generateButton, abortButton, offerInput, authInput);
        }
    });
    export = exp;
