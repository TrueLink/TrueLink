define(function(require, exports, module) {
    "use strict";
    var React = require("react");

    module.exports = React.createClass({
        displayName: "OthersTextMessage",
        render: function() {
            return React.DOM.div({
                className: "bubble bubble-right"
            }, (this.props.sender || "unknown") + ": " + this.props.text);
        }
    });
});