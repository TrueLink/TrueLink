define(["zepto", "q", "react", "modules/channels/chatChannel", "modules/data-types/utf8string"], function ($, Q, React, ChatChannel, Utf8String) {
    "use strict";



    return React.createClass({
        displayName: "ChannelTestInfo",

        send: function () {
            var node = this.refs.messageText.getDOMNode();
            var data = {type: "t", data: node.value};
            node.value = "";
            var messageData = new Utf8String(JSON.stringify(data));
            this.props.send(messageData);
            return false;
        },

        render: function () {
            var channel = this.props.channel;
            var messages = {"s": React.DOM.li(null, "test")}, i = 0;
            channel.messages.map(function (messageData) {
                var data = JSON.parse(messageData.as(Utf8String).value);
                messages["m_" + i] = React.DOM.li(null, data.data);
            });
            return React.DOM.div({style: {float: "left", width: 250, "margin-left": 10 }},
                React.DOM.h1({className: "title"}, channel.name + ": "),
                React.DOM.ul({style: {"list-style-type": "none"}}, messages),
                React.DOM.div(null, React.DOM.form({onSubmit: this.send},
                    React.DOM.input({type: "text", ref: "messageText"}, React.DOM.input({type: "submit", value: "send"}))
                    )));
        }
    });
});