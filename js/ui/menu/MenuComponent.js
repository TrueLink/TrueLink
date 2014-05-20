define(function (require, exports, module) {
    "use strict";
    var MenuSelectProfile = require("./MenuSelectProfile");
    var React = require("react");
    module.exports = React.createClass({
        displayName: "MenuComponent",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var model = this.props.model;
            return {
                profiles: model.getProfiles(),
                currentProfile: model.getCurrentProfile()
            };
        },
        handleSelectProfile: function (profile) {
            this.props.model.setCurrentProfile(profile);
        },

        handleAddProfile: function () {
            this.props.model.addProfile();
            return false;
        },

        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () { this.props.model.on("changed", this._onModelChanged, this); },
        componentWillUnmount: function () { this.props.model.off("changed", this._onModelChanged); },
        render: function () {
            return React.DOM.div({className: this.props.className},
                (!this.state.profiles ? null : MenuSelectProfile({
                    className: "profile-selector",
                    profiles: this.state.profiles,
                    currentProfile: this.state.currentProfile,
                    selectProfile: this.handleSelectProfile
                })), React.DOM.a({onClick: this.handleAddProfile, style: {color: "white"}, href: ""}, "Add profile")
                );
        }
    });
});