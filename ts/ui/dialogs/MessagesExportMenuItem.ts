    "use strict";
    import React = require("react");
    import ReactBootstrap = require("react-bootstrap");
    
    var exp = React.createClass({
        displayName: "MessagesExportMenuItemView",

        _onClick: function(e: MouseEvent) {
            window.open((<HTMLAnchorElement>e.target).href, "_blank");
            return false;
        },

        render: function () {

            var historyToExport = this.props.messages
                .map(message => {
                    if (message.type === "tlgr-invite") {
                        //todo complete
                        var tlgrInvitationMessage = <ITlgrInvitationMessage>message;
                        return "tlgr-invite";
                    }
                    else {
                        var textMessage = <ITextMessage>message;
                        if(textMessage.isMine) {
                            return textMessage.sender + " (me): " + textMessage.text;
                        } else {
                            return (textMessage.sender || "unknown") + ": " + textMessage.text;
                        }
                    }
                }).join("\n");

            return ReactBootstrap.MenuItem({
                href: "data:text/plain;charset=utf-8," + encodeURIComponent(historyToExport),
                onClick: this._onClick
            }, this.props.children);
        }
    });
export = exp;
