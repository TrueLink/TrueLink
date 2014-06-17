define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "MessagesView",
        render: function () {
            var msgs = {}, i = 0;
            this.props.messages.forEach(function (message) {
                msgs["msg_" + ++i] = React.DOM.div({className: "bubble " + (message && message.isMine ? "bubble-right" : "bubble-left")},
                        (message.sender || "unknown") + ": " + message.text);
            });
            return React.DOM.div(null, msgs);
        }
    });
});