"use strict";
import React = require("react");
var exp = React.createClass({
    getInitialState: function() {
        return {isBarShown: !!this.props.shown};
    },
    render: function() {
        var shown = this.state.isBarShown;
        if (this.props.token !== this.token) {
            shown = false;
            this.token = this.props.token;
        }
        return React.DOM.div({
                className: "sidebar-hider"
                            + (shown
                                ? " sidebar-hider-shown"
                                : " sidebar-hider-hidden")
            },
            React.DOM.div({className: "sidebar-hider-bar-container"},
                React.DOM.div({className: "sidebar-hider-bar"},
                    this.props.children[0]),
                React.DOM.div({
                        className: "sidebar-hider-toggler",
                        onClick: function() {
                            this.setState(
                                {isBarShown: !shown});
                            return false;
                        }.bind(this)
                    }, "||")
            ),
            React.DOM.div({className: "sidebar-hider-content"}, 
                this.props.children[1]
            ));
    }
});
export = exp;