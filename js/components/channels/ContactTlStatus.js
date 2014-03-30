define(["zepto", "q", "react", "modules/channels/tlkeChannel", "modules/channels/tokens", "modules/data-types/hex", "modules/data-types/decBlocks"
], function ($, Q, React, TlkeChannel, tokens, Hex, DecBlocks) {
    "use strict";

    var stateStatuses = {};
    stateStatuses[TlkeChannel.STATE_NOT_STARTED] =  "Not started";
    stateStatuses[TlkeChannel.STATE_AWAITING_OFFER] =  "Waiting for offer data";
    stateStatuses[TlkeChannel.STATE_AWAITING_OFFER_RESPONSE] =  "Waiting for offer response";
    stateStatuses[TlkeChannel.STATE_AWAITING_AUTH] =  "Waiting for auth data";
    stateStatuses[TlkeChannel.STATE_AWAITING_AUTH_RESPONSE] =  "Waiting for auth response";
    stateStatuses[TlkeChannel.STATE_CONNECTION_ESTABLISHED] =  "TLKE done";
    stateStatuses[TlkeChannel.STATE_CONNECTION_SYNCED] =  "Contact received via sync";
    stateStatuses[TlkeChannel.STATE_CONNECTION_FAILED] =  "Failed";

    return React.createClass({
        displayName: "ContactTlStatus",

        getInitialState: function () {
            return {};
        },

        setErrorMessage: function (err) {
            this.setState({error: err});
        },

        generate: function () {
            this.setErrorMessage(null);
            try {
                this.props.model.generateTlke();
            } catch (ex) {
                console.error(ex);
                this.setErrorMessage(ex.message || JSON.stringify(ex));
            }
        },

        addOver: function () {
            this.setErrorMessage(null);
            try {
                this.props.model.addOver();
            } catch (ex) {
                console.error(ex);
                this.setErrorMessage(ex.message || JSON.stringify(ex));
            }
        },

        accept: function () {
            this.setErrorMessage(null);
            var offerText = this.refs.offer.getDOMNode().value;
            var offer = DecBlocks.fromString(offerText);
            if (!offer) {
                this.setErrorMessage("Wrong offer");
                return;
            }
            try {
                this.props.model.acceptTlkeOffer(offer.as(Hex));
            } catch (ex) {
                console.error(ex);
                this.setErrorMessage(ex.message || JSON.stringify(ex));
            }
        },
        acceptAuth: function (context) {
            this.setErrorMessage(null);
            var authText = this.refs.auth.getDOMNode().value;
            var auth = DecBlocks.fromString(authText);
            if (!auth) {
                this.setErrorMessage("Wrong auth");
                return;
            }
            try {
                this.props.model.acceptTlkeAuth(auth.as(Hex), context);
            } catch (ex) {
                console.error(ex);
                this.setErrorMessage(ex.message || JSON.stringify(ex));
            }
        },
        render: function () {
            var model = this.props.model;
            var acceptAuth = this.acceptAuth;
            var labelClassName = "secondary";
            var error = model.error ? (model.error.message || JSON.stringify(model.error)) : this.state.error;
            if (model.state === TlkeChannel.STATE_CONNECTION_FAILED) { labelClassName = "alert"; }
            if (model.state === TlkeChannel.STATE_CONNECTION_ESTABLISHED || model.state === TlkeChannel.STATE_CONNECTION_SYNCED) { labelClassName = "success"; }
            var status = error ? React.DOM.span({className: "alert right radius label"}, error) :
                    React.DOM.span({className: labelClassName + " right radius label"}, stateStatuses[model.state]);
            var overStatusSpan = !model.overChannelLastState ? null :
                    React.DOM.span({className: "secondary right radius label"}, "OverChannels: " + stateStatuses[model.overChannelLastState]);
            status = React.DOM.div({className: "row"}, React.DOM.div({className: "small-12 columns"}, status, overStatusSpan));
            var actions = {};

            var i = 0, elem = null;
            if (model.state === TlkeChannel.STATE_NOT_STARTED) {
                elem = React.DOM.div({className: "row"},
                        React.DOM.div({className: "small-12 columns"},
                            React.DOM.label(null, "Offer", React.DOM.input({ref: "offer", type: "text", placeholder: "Offer digits"}))),
                        React.DOM.div({className: "small-6 columns"},
                            React.DOM.a({className: "expand radius button", onClick: this.generate}, "Generate")),
                        React.DOM.div({className: "small-6 columns"},
                            React.DOM.a({className: "expand radius button", onClick: this.accept}, "Accept")));

                actions["a_" + i] = elem;
                i += 1;
            }
            if (model.state !== TlkeChannel.STATE_CONNECTION_ESTABLISHED && model.state !== TlkeChannel.STATE_CONNECTION_SYNCED) {

                model.prompts.forEach(function (prompt) {
                    elem = null;
                    if (prompt.token instanceof tokens.ContactChannelGroup.OfferToken) {
                        if (prompt.token.offer) {
                            elem = React.DOM.label(null, "Offer", React.DOM.input({type: "text", readOnly: true, value: prompt.token.offer.as(DecBlocks).toString()}));
                        }
                    }
                    if (prompt.token instanceof tokens.ContactChannelGroup.AuthToken) {
                        if (prompt.token.auth) {
                            elem = React.DOM.label(null, "Auth", React.DOM.input({type: "text", readOnly: true, value: prompt.token.auth.as(DecBlocks).toString()}));
                        } else {
                            elem = React.DOM.div({className: "row collapse"},
                                    React.DOM.div({className: "small-8 columns"}, React.DOM.input({ref: "auth", type: "text", placeholder: "Auth"})),
                                    React.DOM.div({className: "small-4 columns"}, React.DOM.a({className: "button postfix", onClick: acceptAuth.bind(null, prompt.context)}, "Accept Auth")));
                        }
                    }
                    if (elem) {
                        actions["a_" + i] = React.DOM.div({className: "row"}, React.DOM.div({className: "small-12 columns"}, elem));
                        i += 1;
                    }

                });

            }
            if (model.state === TlkeChannel.STATE_CONNECTION_ESTABLISHED || model.state === TlkeChannel.STATE_CONNECTION_SYNCED) {
                elem = React.DOM.div({className: "row"},
                    React.DOM.div({className: "small-12 columns"},
                        React.DOM.a({className: "tiny radius button", onClick: this.addOver}, "Add channel over channel")));

                actions["a_" + i] = elem;
                i += 1;
            }

            return React.DOM.div(null, actions, status);
        }
    });
});