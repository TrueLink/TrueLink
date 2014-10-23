"use strict";
import MessageHistory = require("../../models/MessageHistory");

var exp = function (title: string, history: MessageHistory.MessageHistory) {

    var renderMessageToExport = function (message: IUserMessage) {
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
    };

    var historyToExport =
        "==== " + title + " ====\n"
        + history.getHistory().map(renderMessageToExport).join("\n");

    return "data:text/plain;charset=utf-8," + encodeURIComponent(historyToExport);
};

export = exp;
