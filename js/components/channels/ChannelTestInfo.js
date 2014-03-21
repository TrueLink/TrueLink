define(["zepto", "q", "react", "modules/channels/establishChannel", "modules/data-types/hex"], function ($, Q, React, Establish, Hex) {
    "use strict";

    return React.createClass({
        displayName: "ChannelTestInfo",

        generate: function () {
            this.props.generate();
        },
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
            switch (channel.state) {
            case Establish.STATE_NOT_STARTED:
                status = React.DOM.span(null, "Not started");
                actions = React.DOM.div(null,
                    React.DOM.button({onClick: this.generate}, "Generate"),
                    React.DOM.input({ref: "offer"}),
                    React.DOM.button({onClick: this.accept}, "Accept"));
                break;
            case Establish.STATE_AWAITING_OFFER:
                status = React.DOM.span(null, "Waiting for offer data");
                break;
            case Establish.STATE_AWAITING_OFFER_RESPONSE:
                status = React.DOM.span(null, "Waiting for offer response");
                actions = {};
                var i = 0;
                channel.messages.forEach(function (message) {
                    if (message instanceof Establish.OfferMessage) {
                        actions["a" + i++] = React.DOM.div(null, message.offer.as(Hex).value);
                    } else if (message instanceof Establish.AuthMessage) {
                        actions["a" + i++] = React.DOM.div(null, message.auth.as(Hex).value);
                    }
                });
                break;
            case Establish.STATE_AWAITING_AUTH:
                status = React.DOM.span(null, "Waiting for auth data");
                var prompts = channel.prompts;
                if (prompts.length) {
                    var prompt = prompts[prompts.length - 1];
                    actions = React.DOM.div(null,
                        React.DOM.input({ref: "auth"}),
                        React.DOM.button({onClick: this.acceptAuth}, "Accept Auth"));
                }
                break;
            case Establish.STATE_AWAITING_AUTH_RESPONSE:
                status = React.DOM.span(null, "Waiting for auth response");
                actions = {};
                var i = 0;
                channel.messages.forEach(function (message) {
                    if (message instanceof Establish.OfferMessage) {
                        actions["a" + i++] = React.DOM.div(null, message.offer.as(Hex).value);
                    } else if (message instanceof Establish.AuthMessage) {
                        actions["a" + i++] = React.DOM.div(null, message.auth.as(Hex).value);
                    }
                });
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