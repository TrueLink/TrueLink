define(["zepto", "q", "react", "modules/channels/establishChannel"], function ($, Q, React, Establish) {
    "use strict";

    return React.createClass({
        displayName: "ChannelTestInfo",


        render: function () {
            var channel = this.props.channel;
            return React.DOM.div(null, channel.name);
        }
    });
});