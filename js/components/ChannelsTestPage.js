define(["zepto", "q", "react", "bind", "components/channels/ChannelTestInfo",
 "components/channels/ChatChannelTestInfo"], function ($, Q, React, bind, ChannelTestInfo, ChatChannelTestInfo) {
    "use strict";

    return React.createClass({
        displayName: "ChannelsTestPage",
        mixins: [bind],

        render: function () {
            var props = this.props;
            var TlkeHandshakeChannelViews = {};
            var chatChannelViews = {};
            $.each(this.props.TlkeHandshakeChannels, function (key, channelInfo) {
                TlkeHandshakeChannelViews[key] = ChannelTestInfo({
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
                    TlkeHandshakeChannelViews,
                    React.DOM.div(null, React.DOM.button({onClick: this.props.addChannel}, "Add channel")),
                    React.DOM.div(null, chatChannelViews)
                ));

        }
    });
});