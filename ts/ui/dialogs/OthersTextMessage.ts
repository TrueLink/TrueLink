    "use strict";
    import React = require("react");

    var exp = React.createClass({
        displayName: "OthersTextMessage",
        render: function() {
            return React.DOM.div({
                className: "bubble bubble-left"
            }, (this.props.sender || "unknown") + ": " + this.props.text);
        }
    });
export = exp;
