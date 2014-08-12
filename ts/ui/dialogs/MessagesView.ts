define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    var MyTextMessage = require("./MyTextMessage");
    var OthersTextMessage = require("./OthersTextMessage");
    var GroupChatInviteMessage = require("./GroupChatInviteMessage");

    module.exports = React.createClass({
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
                return new GroupChatInviteMessage({ 
                    message: message,
                    onGoToChat : this._handleGoToChat,
                    profileName: this.props.profile.name 
                });
            }
            if(message.isMine) {
                return new MyTextMessage(message);
            } else {
                return new OthersTextMessage(message);
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
});
