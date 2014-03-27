define(["zepto", "q", "react", "modules/data-types/utf8string"], function ($, Q, React, Utf8String) {
    "use strict";



    return React.createClass({
        displayName: "Dialog",

        send: function () {
            var node = this.refs.messageText.getDOMNode();
            var messageData = {
                text: node.value
            };
            this.props.send(messageData);
            node.value = "";
            return false;
        },

        render: function () {
            var model = this.props.model;
            var messages = {}, i = 0;
            model.messages.forEach(function (messageData) {
                messages["m_" + i] = React.DOM.li(null, messageData.text);
                i += 1;
            });
            return React.DOM.div({style: {float: "left", width: 250, "margin-left": 10}},
                React.DOM.h5({className: ""}, model.name + ": "),
                React.DOM.ul({style: {"list-style-type": "none"}}, messages),
                React.DOM.div(null, React.DOM.form({onSubmit: this.send},
                    React.DOM.input({type: "text", ref: "messageText"}, React.DOM.input({type: "submit", value: "send"}))
                    )));
        }
    });
});