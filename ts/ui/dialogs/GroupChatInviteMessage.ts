    "use strict";
    import React = require("react");

    var exp = React.createClass({
        displayName: "GroupChatInviteMessage",

        getInitialState: function() {
            var state : any = {};
            console.log(this.props);
            state.accepted = this.props.message.accepted;
            state.visibleName = this.props.profileName;
            return state;
        },

        _accept: function() {
            this.props.message.accept(this.props.message.inviteId, this.state.visibleName);
            this.setState({ accepted: true });
        },

        _reject: function() {
            this.props.message.reject();
            this.setState({ accepted: false });
        },

        _handleGoToChat: function (e) {
            e.preventDefault();
        },

        render: function() {
            if (this.state.accepted === true) {
                return React.DOM.div({
                        className: "bubble bubble-right"
                    },
                    "You have accepted invitation to group chat from ",
                    this.props.message.sender, 
                    React.DOM.button({ style: { "display": "block" }, onClick: this.props.onGoToChat.bind(null, this.props.message.inviteId) }, "Go to chat")
                );
            }
            if (this.state.accepted === false) {
                return React.DOM.div({
                        className: "bubble bubble-right"
                    },
                    "You have ", 
                    React.DOM.strong(null, "rejected"), 
                    " invitation to group chat from ",
                    this.props.message.sender
                );
            }
            return React.DOM.div({
                    className: "bubble bubble-right"
                },
                React.DOM.p(null,
                    this.props.message.sender,
                    " invited you to group chat"
                ),
                React.DOM.button({
                    onClick: this._accept
                }, "Accept"),
                React.DOM.button({
                    onClick: this._reject
                }, "Reject"),
                React.DOM.span({ }, " Name: "),
                React.DOM.input({ 
                    value: this.state.visibleName,
                    type: "text",
                    onChange: function (e) {
                        this.setState({ visibleName: e.target.value });
                    }.bind(this)
                })

            );
        }
    });
export = exp;
