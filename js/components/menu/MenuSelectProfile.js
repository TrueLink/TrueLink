define(["react"], function (React) {
    "use strict";

    return React.createClass({
        displayName: "MenuSelectProfile",

        handleSelect: function (evt) {
            var profileId = evt.target.value;
            var profile = this.props.profiles.filter(function (profile) {
                return profile.id === profileId;
            })[0];
            this.props.selectProfile(profile);
        },

        render: function () {
            var current = this.props.selectedProfile;
            return React.DOM.div({ className: this.props.className },
                React.DOM.div({className: "title"}, "Test"),
                React.DOM.select({
                    value: current.id,
                    onChange: this.handleSelect
                }, this.props.profiles.map(function (profile) {
                    return React.DOM.option({key: profile.id, value: profile.id}, profile.name);
                })
            ));
        }
    });
});