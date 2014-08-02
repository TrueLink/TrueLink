define(function(require, exports, module) {
    "use strict";
    var React = require("react");
    var reactObserver = require("mixins/reactObserver");
    var MessagesView = require("./MessagesView");
    var ContactList = require("ui/contacts/ContactList");
    module.exports = React.createClass({
        displayName: "DialogPage",
        mixins: [reactObserver],
        _onSubmit: function() {
            try {
                var node = this.refs.inputMessage.getDOMNode();
                var messageObj = node.value;
                node.value = "";
                this.props.pageModel.model.sendMessage(messageObj);
            } catch (ex) {
                console.error(ex);
            }
            return false;
        },
        componentDidMount: function() {
            var dialog = this.props.pageModel.model;
            dialog.markAsRead();
            dialog.on("changed", dialog.markAsRead, dialog);
        },
        componentWillUnmount: function() {
            var dialog = this.props.pageModel.model;
            dialog.off("changed", dialog.markAsRead, dialog);
        },
        _onAddPeople: function() {
            this.setState({ addPeople: true });
            return false;
        },
        _onConfigure: function() {
            var dialog = this.props.pageModel.model;
            // TODO this is kinda dumb
            this.props.router.navigate("contact", dialog.contacts[0]);
        },
        render: function() {
            var dialog = this.state.model;
            //            var pageModel = this.state.pageModel;
            var router = this.props.router;

            var words = ["POP!", "POOF!", "BANG!", "ZAP!", "WHOOSH!", "POW!", "BONG!", "KA-POW!", "SNAP!", "CRACK!", "SIZZLE!", "BAM!"]
            function randomItem(list) {
                return list[Math.floor(Math.random() * list.length)];
            }

            var input = React.DOM.div({ className: "message-input" },
                React.DOM.form({ onSubmit: this._onSubmit }, React.DOM.input({ ref: "inputMessage" })),
                React.DOM.div({ className: "send-button" }, React.DOM.button({ onClick: this._onSubmit }, randomItem(words))));
            var configure = React.DOM.div({ className: "message-input" },
                React.DOM.button({ onClick: this._onConfigure }, "Configure secure channel"));

            return React.DOM.div({ className: "dialog-page app-page" },
                React.DOM.div({ className: "app-page-header" },
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("dialogs", dialog.profile)
                    }, "〈 Dialog: " + dialog.name),
                    React.DOM.a({
                        className: "header-button",
                        href: "",
                        onClick: this._onAddPeople
                    }, "Add People")),
                React.DOM.div({ className: "app-page-content has-header has-footer" },
                    MessagesView({ messages: dialog.messages }),
                    ContactList({ contacts: dialog.profile.contacts })),
                React.DOM.div({ className: "app-page-footer" },
                    React.DOM.div({ className: "tabs-header" },
                        React.DOM.div({ className: "tab-title" }, "Secure channel")),
                    React.DOM.div({ className: "tabs-content" },
                        dialog.hasSecureChannels() ? input : configure)));
        }
    });
})

