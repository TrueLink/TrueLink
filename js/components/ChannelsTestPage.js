define(["zepto", "q", "react", "bind", "modules/channels/establishChannel", "components/channels/ChannelTestInfo"], function ($, Q, React, bind, Establish, ChannelTestInfo) {
    "use strict";

    return React.createClass({
        displayName: "ChannelsTestPage",
        mixins: [bind],

        render: function () {
            var props = this.props;
            var channels = {};
            $.each(this.props.channels, function (key, channelInfo) {
                channels[key] = ChannelTestInfo({
                    channel: channelInfo,
                    generate: props.generate.bind(null, key),
                    accept: props.accept.bind(null, key),
                    acceptAuth: props.acceptAuth.bind(null, key)
                });
            });


            return React.DOM.div({id: "app"},
                React.DOM.div({className: "default-background-dark wide"},
                    channels, React.DOM.button({onClick: this.props.addChannel}, "Add channel")));

        }
    });
});