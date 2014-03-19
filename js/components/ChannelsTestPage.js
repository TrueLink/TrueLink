define(["zepto", "q", "react", "modules/channels/establishChannel", "components/ChannelTestInfo"], function ($, Q, React, Establish, ChannelTestInfo) {
    "use strict";

    return React.createClass({
        displayName: "ChannelsTestPage",

        getInitialState: function () {
            return { alice: null, bob: null };
        },
        start: function () {
            var channelManager = this.props.app.channelStuff;
            var alice = channelManager.createEstablishChannel("Alice");
            var bob = channelManager.createEstablishChannel("Bob");

            this.setState({alice: alice, bob: bob});

            //alice.enterToken(new Establish.GenerateToken());
        },

        render: function () {


            var w;
            if (this.state.alice && this.state.bob) {
                w = React.DOM.div(null,
                    ChannelTestInfo({channel: this.state.alice}),
                    ChannelTestInfo({channel: this.state.bob}));
            } else {
                w = React.DOM.button({onClick: this.start}, "Start");

            }
            return React.DOM.div({className: "default-background-dark wide"}, w);

        }
    });
});