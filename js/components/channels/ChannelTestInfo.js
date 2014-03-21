define(["zepto", "q", "react", "modules/channels/establishChannel", "modules/data-types/hex"], function ($, Q, React, Establish, Hex) {
    "use strict";

    var stateStatuses = {};
    stateStatuses[Establish.STATE_NOT_STARTED] =  "Not started";
    stateStatuses[Establish.STATE_AWAITING_OFFER] =  "Waiting for offer data";
    stateStatuses[Establish.STATE_AWAITING_OFFER_RESPONSE] =  "Waiting for offer response";
    stateStatuses[Establish.STATE_AWAITING_AUTH] =  "Waiting for auth data";
    stateStatuses[Establish.STATE_AWAITING_AUTH_RESPONSE] =  "Waiting for auth response";
    stateStatuses[Establish.STATE_CONNECTION_ESTABLISHED] =  "Done";
    stateStatuses[Establish.STATE_CONNECTION_FAILED] =  "Failed";

    return React.createClass({
        displayName: "ChannelTestInfo",

        generate: function () {
            this.props.generate();
        },
        accept: function () {
            var offerHex = this.refs.offer.getDOMNode().value;
            this.props.accept(new Hex(offerHex));
        },
        acceptAuth: function (context) {
            var authHex = this.refs.auth.getDOMNode().value;
            this.props.acceptAuth(new Hex(authHex), context);
        },
        render: function () {
            var channel = this.props.channel;
            var acceptAuth = this.acceptAuth;
            var status = stateStatuses[channel.state];
            var actions = {};

            var i = 0, elem;
            if (channel.state === Establish.STATE_NOT_STARTED) {
                elem = React.DOM.div(null,
                    React.DOM.button({onClick: this.generate}, "Generate"),
                    React.DOM.input({ref: "offer"}),
                    React.DOM.button({onClick: this.accept}, "Accept"));
                actions["a_" + i] = elem;
                i += 1;
            }
            if (channel.state !== Establish.STATE_CONNECTION_ESTABLISHED) {
                channel.prompts.forEach(function (prompt) {
                    elem = null;
                    if (prompt.token instanceof Establish.OfferToken) {
                        if (prompt.token.offer) {
                            elem = React.DOM.div(null, prompt.token.offer.as(Hex).value);
                        }
                    }
                    if (prompt.token instanceof Establish.AuthToken) {
                        if (prompt.token.auth) {
                            elem = React.DOM.div(null, prompt.token.auth.as(Hex).value);
                        } else {
                            elem = React.DOM.div(null,
                                React.DOM.input({ref: "auth"}),
                                React.DOM.button({onClick: acceptAuth.bind(null, prompt.context)}, "Accept Auth"));
                        }
                    }
                    if (elem) {
                        actions["a_" + i] = elem;
                        i += 1;
                    }
                });
            }

            return React.DOM.div(null, channel.name + ": ", status, actions);
        }
    });
});