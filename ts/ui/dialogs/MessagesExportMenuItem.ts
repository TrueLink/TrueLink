    "use strict";
    import React = require("react");
    import ReactBootstrap = require("react-bootstrap");
    
    var exp = React.createClass({
        displayName: "MessagesExportMenuItemView",

        _onClick: function(e: MouseEvent) {
            window.open((<HTMLAnchorElement>e.target).href, "_blank");
            return false;
        },

        _renderMessageToExport: function(message: IUserMessage) {
            if (message.type === "tlgr-invite") {
                var tlgrInvitationMessage = <ITlgrInvitationMessage>message;
                if ((<any>tlgrInvitationMessage).accepted === true) {
                    return "You have accepted invitation to group chat from " + tlgrInvitationMessage.sender;
                }
                if ((<any>tlgrInvitationMessage).accepted === false) {
                    return "You have rejected invitation to group chat from " + tlgrInvitationMessage.sender;
                }
                return message.sender + " invited you to group chat. You did not react yet.";
            }
            else {
                var textMessage = <ITextMessage>message;
                if(textMessage.isMine) {
                    return textMessage.sender + " (me): " + textMessage.text;
                } else {
                    return (textMessage.sender || "unknown") + ": " + textMessage.text;
                }
            }
        },

        render: function () {
            var historyToExport = this.props.messages.map(this._renderMessageToExport).join("\n");
            return ReactBootstrap.MenuItem({
                href: "data:text/plain;charset=utf-8," + encodeURIComponent(historyToExport),
                onClick: this._onClick
            }, this.props.children);
        }
    });
export = exp;
