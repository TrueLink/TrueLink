define(function(require, exports, module) {
    "use strict";
    var React = require("react");

    module.exports = React.createClass({
        displayName: "GroupChatInviteMessage",

        getInitialState: function() {
            var state = {};
            console.log(this.props);
            state.accepted = this.props.accepted;
            return state;
        },

        _accept: function() {
            this.props.accept(this.props.inviteId);
            this.setState({ accepted: true });
        },

        _reject: function() {
            this.props.reject();
            this.setState({ accepted: false });
        },

        render: function() {
            if (this.state.accepted === true) {
                return React.DOM.div({
                        className: "bubble bubble-right"
                    },
                    "You have accepted invitation to group chat from ",
                    this.props.sender
                );
            }
            if (this.state.accepted === false) {
                return React.DOM.div({
                        className: "bubble bubble-right"
                    },
                    "You have ", 
                    React.DOM.strong(null, "rejected"), 
                    " invitation to group chat from ",
                    this.props.sender
                );
            }
            return React.DOM.div({
                    className: "bubble bubble-right"
                },
                React.DOM.p(null,
                    this.props.sender,
                    " invited you to group chat"
                ),
                React.DOM.button({
                    onClick: this._accept
                }, "Accept"),
                React.DOM.button({
                    onClick: this._reject
                }, "Reject")
            );
        }
    });
});
