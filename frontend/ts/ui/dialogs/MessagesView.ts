    "use strict";
    import React = require("react");
    import MyTextMessage = require("./MyTextMessage");
    import OthersTextMessage = require("./OthersTextMessage");
    import GroupChatInviteMessage = require("./GroupChatInviteMessage");

    var exp = React.createClass({
        displayName: "MessagesView",

        componentDidUpdate: function (nextProps) {
            //if (nextProps.messages.length > this.props.messages.length) {
                var elem = this.refs.messageView.getDOMNode();
                elem = elem.parentNode;
                elem.scrollTop = elem.scrollHeight;
            //}

        },

        _handleGoToChat: function (chatId) {

            this.props.onGoToChat(chatId);
        },

        _renderMessage: function(message) {
            if (message.type === "tlgr-invite") {
                return GroupChatInviteMessage({ 
                    message: message,
                    onGoToChat : this._handleGoToChat,
                    profileName: this.props.profile.name 
                });
            }
            if(message.isMine) {
                return MyTextMessage(message);
            } else {
                return OthersTextMessage(message);
            }
        },

        render: function () {
            var msgs = {}, i = 0;
            for(var i = 0; i < this.props.messages.length; ++i) {
                var message = this.props.messages[i];
                msgs["msg_" + i] = this._renderMessage(message);
            }
            return React.DOM.div({ className: "message-view", ref: "messageView" }, msgs);
        }
    });
export = exp;
