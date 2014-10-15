    "use strict";
    import React = require("react");
    import ReactBootstrap = require("react-bootstrap");
    import EditableField = require("ui/common/EditableField");
    import reactObserver = require("mixins/reactObserver");
    import MessagesView = require("./MessagesView");
    import MessagesExportMenuItem = require("./MessagesExportMenuItem");
    import ContactList = require("ui/contacts/ContactList");
    import GroupChat = require("models/GroupChat");
    import Profile = require("models/Profile");

    var exp = React.createClass({
        displayName: "GroupChatPage",
        mixins: [reactObserver],
        getInitialState: function () {
            return {
                messageText: "",
                showMembers: false,
                addContact: false
            };
        },
        _onSubmit: function() {
            try {
                if(this.state.messageText.trim()) {
                    this.props.pageModel.model.sendMessage(this.state.messageText);
                    this.setState({messageText:""});
                }
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
            //this.setState({ addContact: !this.state.addContact });
            this.state.showMembers = false;
            this.state.pageModel.set("addContact", !this.state.pageModel.addContact);
            return false;
        },
        _handleMembers: function() {
            this.setState({ showMembers: !this.state.showMembers });
            return false;
        },
        _handleAddContact: function(contacts) {
            var groupChat: GroupChat.GroupChat = this.state.model;
            var profile: Profile.Profile = groupChat.profile;
            for (var key in contacts) {
                var contact = contacts[key];
                if(contact.tlConnection.canSendMessages()){
                    var invitation = groupChat.grConnection._activeTlgr.generateInvitation();
                    contact.sendTlgrInvite({invite: invitation});
                }
            }
            this.state.pageModel.set("addContact", false);
            return false;
        },

        _handleLeaveChat: function (e) {
            e.preventDefault();
            this.state.model.profile.leaveGroupChat(this.state.model);
            this.props.router.createNavigateHandler("dialogs", this.state.model.profile)();
            return false;
        },

        _handleRekey: function (e) {
            e.preventDefault();
            this.state.model.grConnection.initiateRekey(this.state.model.grConnection._activeTlgr.getUsers());
        },

        _handleRemoveMembers: function (membersToRemove) {
            membersToRemove = membersToRemove.map(function (item) {return item.aid; })
            var members = this.state.model.grConnection._activeTlgr.getUsers().filter(function (item) {
                return membersToRemove.indexOf(item.aid) === -1;
            });
            if (membersToRemove.length === 0) {
                members = this.state.model.grConnection._activeTlgr.getUsers().map(function(i){return i.aid;});
            }
            this.state.model.grConnection.initiateRekey(members);
        },

        renderMembers: function () {
            var contacts = this.state.model.grConnection._activeTlgr.getUsers();
            return ContactList({
                    buttonText: "remove",
                    currentUser: this.state.model.grConnection.getMyName(),
                    checkBoxes: true,
                    contacts: contacts,
                    onCommand: this._handleRemoveMembers
            });

        },

        render: function () {
            var groupChat : GroupChat.GroupChat = this.state.model;
            //            var pageModel = this.state.pageModel;
            var router = this.props.router;

            var words = ["POP!", "POOF!", "BANG!", "ZAP!", "WHOOSH!", "POW!", "BONG!", "KA-POW!", "SNAP!", "CRACK!", "SIZZLE!", "BAM!"]
            function randomItem(list) {
                return list[Math.floor(Math.random() * list.length)];
            }

            var input = React.DOM.div({ className: "message-input" },
                    React.DOM.form({ onSubmit: this._onSubmit },
                        React.DOM.input({
                            value: this.state.messageText,
                            onChange: function (e) { this.setState({ messageText: e.target.value });}.bind(this)
                        })),
                React.DOM.div({ className: "send-button" }, React.DOM.button({ onClick: this._onSubmit }, randomItem(words))));
            var content;
            if (this.state.pageModel.addContact) {
                content = ContactList({
                    buttonText: "Invite",
                    checkBoxes: true,
                    contacts: groupChat.profile.contacts, // TODO somehow filter for already added....
                    onCommand: this._handleAddContact
                });
            } else if (this.state.showMembers) {
                content = this.renderMembers();
            } else {
                content = MessagesView({ messages: groupChat.history.getHistory() });
            }

            return React.DOM.div({ className: "dialog-page app-page" },
                React.DOM.div({ className: "app-page-header" },
                    React.DOM.span({className: "header-dropdown-menu-button"},
                        ReactBootstrap.DropdownButton({
                                title: "∴",
                                pullRight: true,
                                onSelect: function () {} // menu does not close on item click without this
                            },
                            ReactBootstrap.MenuItem({
                                onClick: this._onAddPeople
                            }, "Add members"),
                            ReactBootstrap.MenuItem({
                                onClick: this._handleLeaveChat
                            }, "Leave"),
                            ReactBootstrap.MenuItem({
                                onClick: this._handleMembers
                            }, "Manage members"),
                            ReactBootstrap.MenuItem({
                                onClick: this._handleRekey
                            }, "Rekey"),
                            MessagesExportMenuItem({
                                messages: groupChat.history.getHistory()
                            }, "Export History"))),
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("dialogs", groupChat.profile)
                    }, "〈 "),
                    EditableField({
                        id: "gcName",
                        inline: true,
                        onChanged: groupChat.set.bind(groupChat, "name"),
                        value: groupChat.name
                    })),
                React.DOM.div({ className: "app-page-content has-header has-footer" },
                    content),
                   // ContactList({ contacts: dialog.profile.contacts, onClick: this._handleAddContact })),
                React.DOM.div({ className: "app-page-footer" },
                    React.DOM.div({ className: "tabs-header" },
                        React.DOM.div({ className: "tab-title" }, "Secure channel")),
                    React.DOM.div({ className: "tabs-content" },
                        input)));
        }
    });

export = exp;
