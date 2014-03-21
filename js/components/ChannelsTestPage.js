define(["zepto", "q", "react", "bind", "modules/channels/establishChannel", "components/channels/ChannelTestInfo", "components/channels/ChatChannelTestInfo"], function ($, Q, React, bind, Establish, ChannelTestInfo, ChatChannelTestInfo) {
    "use strict";

    return React.createClass({
        displayName: "ChannelsTestPage",
        mixins: [bind],

        render: function () {
            var props = this.props;
            var establishChannelViews = {};
            var chatChannelViews = {};
            $.each(this.props.establishChannels, function (key, channelInfo) {
                establishChannelViews[key] = ChannelTestInfo({
                    channel: channelInfo,
                    generate: props.generate.bind(null, key),
                    accept: props.accept.bind(null, key),
                    acceptAuth: props.acceptAuth.bind(null, key)
                });
            });
            $.each(this.props.chatChannels, function (key, channelInfo) {
                chatChannelViews[key] = ChatChannelTestInfo({
                    channel: channelInfo,
                    send: props.sendTextMessage.bind(null, key)
                });
            });


            return React.DOM.div({id: "app"},
                React.DOM.div({className: "default-background-dark wide"},
                    establishChannelViews,
                    React.DOM.div(null, React.DOM.button({onClick: this.props.addChannel}, "Add channel")),
                    React.DOM.div(null, chatChannelViews)
                ));

        }
    });
});