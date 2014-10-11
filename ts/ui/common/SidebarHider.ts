"use strict";
import React = require("react");
var exp = React.createClass({
    getInitialState: function() {
        return {isBarShown: !!this.props.shown};
    },
    render: function() {
        return React.DOM.div({
                className: "sidebar-hider"
                            + (this.state.isBarShown
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
                                {isBarShown: !this.state.isBarShown});
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