define(["zepto", "q", "react", "bind", "modules/channels/establishChannel", "components/channels/ChannelTestInfo"], function ($, Q, React, bind, Establish, ChannelTestInfo) {
    "use strict";

    return React.createClass({
        displayName: "ChannelsTestPage",
        mixins: [bind],

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

        generate: function (channel) {
            channel.enterToken(new Establish.GenerateToken());
            this.forceUpdate();
        },
        accept: function (channel, offer) {
            channel.enterToken(new Establish.OfferToken(offer));
            this.forceUpdate();
        },
        acceptAuth: function (channel, auth) {
            channel.enterToken(new Establish.AuthToken(auth));
            this.forceUpdate();
        },

        render: function () {


            var w;
            if (this.state.alice && this.state.bob) {
                var alice = this.state.alice;
                var bob = this.state.bob;
                w = React.DOM.div(null,
                    ChannelTestInfo({
                        channel: alice,
                        generate: this.generate.bind(this, alice),
                        accept: this.accept.bind(this, alice),
                        acceptAuth: this.acceptAuth.bind(this, alice),
                        messages: this.props.app.channelStuff.getMessages(alice),
                        prompts: this.props.app.channelStuff.getPrompts(alice)
                    }),
                    ChannelTestInfo({
                        channel: bob,
                        generate: this.generate.bind(this, bob),
                        accept: this.accept.bind(this, bob),
                        acceptAuth: this.acceptAuth.bind(this, bob),
                        messages: this.props.app.channelStuff.getMessages(bob),
                        prompts: this.props.app.channelStuff.getPrompts(bob)
                    }));
            } else {
                w = React.DOM.button({onClick: this.start}, "Start");

            }
            return React.DOM.div({className: "default-background-dark wide"}, w);

        }
    });
});