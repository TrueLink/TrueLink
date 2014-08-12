define(function(require, exports, module) {
    "use strict";
    var React = require("react");

    module.exports = React.createClass({
        displayName: "MyTextMessage",
        render: function() {
            return React.DOM.div({
                    className: "bubble bubble-left"
                },
                this.props.sender + " (me): " + this.props.text
            );
        }
    });
});