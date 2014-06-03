define(function (require, exports, module) {
    "use strict";
    var MenuSelectProfile = require("./MenuSelectProfile");
    var React = require("react");
    module.exports = React.createClass({
        displayName: "MenuComponent",
        getInitialState: function () {
            return this._getState();
        },

        getMenuItems: function () {
            // model is Menu here (menu is not like pages)
            var model = this.props.model;
            var router = this.props.router;
            var currentProfile = model.app.currentProfile;
            return {
                "Documents": {
                    handler: router.createNavigateHandler("documents", currentProfile),
                    className: "menu-item"
                },
                "Dialogs": {
                    handler: router.createNavigateHandler("dialogs", currentProfile),
                    className: "menu-item"
                },
                "Contacts": {
                    handler: router.createNavigateHandler("contacts", currentProfile),
                    className: "menu-item last"
                },
                "Profile settings": {
                    handler: router.createNavigateHandler("profile", currentProfile),
                    className: "menu-item secondary"
                },
                "Clear storage (temp)": {
                    handler: function () {
                        fakeDb.clear();
                        location.reload(true);
                    },
                    className: "menu-item secondary"
                }
            };
        },
        _getState: function () {
            var model = this.props.model;
            return {
                profiles: model.getProfiles(),
                currentProfile: model.getCurrentProfile()
            };
        },
        handleSelectProfile: function (profile) {
            var model = this.props.model;
            model.setCurrentProfile(profile);
            this.props.router.navigate("home", model.app);
        },

        handleAddProfile: function () {
            var model = this.props.model;
            model.addProfile();
            this.props.router.navigate("home", model.app);
            return false;
        },

        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () { this.props.model.on("changed", this._onModelChanged, this); },
        componentWillUnmount: function () { this.props.model.off("changed", this._onModelChanged, this); },
        render: function () {
            var menuItems = {}, items = this.getMenuItems(), title, item;
            for (title in items) {
                item = items[title];
                menuItems[title] = React.DOM.a({
                    href: "",
                    className: item.className,
                    onClick: item.handler
                }, title);
            }

            return React.DOM.div({className: this.props.className},
                (!this.state.profiles ? null : MenuSelectProfile({
                    className: "profile-selector",
                    profiles: this.state.profiles,
                    currentProfile: this.state.currentProfile,
                    selectProfile: this.handleSelectProfile,
                    addProfile: this.handleAddProfile
                })), menuItems);
        }
    });
});