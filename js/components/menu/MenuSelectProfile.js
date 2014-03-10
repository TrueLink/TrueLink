define(["react"], function (React) {
    "use strict";

    return React.createClass({
        displayName: "MenuSelectProfile",

        handleSelect: function (evt) {
            var profileId = evt.target.value;
            if (profileId === "__add") {
                return;
            }
            var profile = this.props.profiles.filter(function (profile) {
                return profile.id === profileId;
            })[0];
            this.props.selectProfile(profile);
        },

        render: function () {
            var current = this.props.selectedProfile;
            var options = this.props.profiles.map(function (profile) {
                return React.DOM.option({key: profile.id, value: profile.id, className: "title"}, profile.name);
            });
            options.push(React.DOM.optgroup({key: "__add", label: "───"},
                React.DOM.option({value: "__add", className: "title"}, "Add profile..."))
                );
            return React.DOM.div({ className: this.props.className },
                React.DOM.select({
                    className: "title",
                    value: current.id,
                    onChange: this.handleSelect
                }, options)
                );
        }
    });
});