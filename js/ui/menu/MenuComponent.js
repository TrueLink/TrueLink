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
            var model = this.props.model;
            var router = this.props.router;
            var currentProfile = model.app.currentProfile;
            return {
                "Documents": router.createNavigateHandler("documents", currentProfile),
                "Dialogs": router.createNavigateHandler("dialogs", currentProfile),
                "Contacts": router.createNavigateHandler("contacts", currentProfile),
                "Profile settings": router.createNavigateHandler("profile", currentProfile)
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
        componentWillUnmount: function () { this.props.model.off("changed", this._onModelChanged); },
        render: function () {
            var menuItems = {}, items = this.getMenuItems();
            for (var title in items) {
                menuItems[title] = React.DOM.a({href:"", className: "menu-item", onClick: items[title]}, title);
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