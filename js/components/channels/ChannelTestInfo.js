define(["zepto", "q", "react", "modules/channels/establishChannel", "modules/data-types/hex"], function ($, Q, React, Establish, Hex) {
    "use strict";

    return React.createClass({
        displayName: "ChannelTestInfo",
        accept: function () {
            var offerHex = this.refs.offer.getDOMNode().value;
            this.props.accept(new Hex(offerHex));
        },
        acceptAuth: function () {
            var authHex = this.refs.auth.getDOMNode().value;
            this.props.acceptAuth(new Hex(authHex));
        },
        render: function () {
            var channel = this.props.channel, status, actions;
            switch (channel.getState()) {
            case Establish.STATE_NOT_STARTED:
                status = React.DOM.span(null, "Not started");
                actions = React.DOM.div(null,
                    React.DOM.button({onClick: this.props.generate}, "Generate"),
                    React.DOM.input({ref: "offer"}),
                    React.DOM.button({onClick: this.accept}, "Accept"));
                break;
            case Establish.STATE_AWAITING_OFFER:
                status = React.DOM.span(null, "Waiting for offer data");
                var prompts = this.props.prompts;
                if (prompts.length) {
                    var prompt = prompts[prompts.length - 1];
                    actions = React.DOM.div(null,
                        React.DOM.input({ref: "auth"}),
                        React.DOM.button({onClick: this.props.acceptAuth}, "Accept Auth"));
                }
                break;
            case Establish.STATE_AWAITING_OFFER_RESPONSE:
                status = React.DOM.span(null, "Waiting for offer response");
                var message = this.props.messages[this.props.messages.length - 1];
                actions = React.DOM.div(null, message.offer.as(Hex).value);
                break;
            case Establish.STATE_AWAITING_AUTH:
                status = React.DOM.span(null, "Waiting for auth data");
                break;
            case Establish.STATE_AWAITING_AUTH_RESPONSE:
                status = React.DOM.span(null, "Waiting for auth response");
                break;
            case Establish.STATE_CONNECTION_ESTABLISHED:
                status = React.DOM.span(null, "Done");
                break;
            case Establish.STATE_CONNECTION_FAILED:
                status = React.DOM.span(null, "Failed");
                break;
            }

            return React.DOM.div(null, channel.name + ": ", status, actions);
        }
    });
});