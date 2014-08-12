    "use strict";
    var React = require("react");

    var exp = React.createClass({
        displayName: "OthersTextMessage",
        render: function() {
            return React.DOM.div({
                className: "bubble bubble-right"
            }, (this.props.sender || "unknown") + ": " + this.props.text);
        }
    });
export = exp;
