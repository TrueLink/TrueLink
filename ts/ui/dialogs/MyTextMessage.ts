    "use strict";
    import React = require("react");

    var exp = React.createClass({
        displayName: "MyTextMessage",
        render: function() {
            return React.DOM.div({
                    className: "bubble bubble-right"
                },
                this.props.sender + " (me): " + this.props.text
            );
        }
    });
export = exp;
