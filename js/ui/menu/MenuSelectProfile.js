define(["react"], function (React) {
    "use strict";

    return React.createClass({
        displayName: "MenuSelectProfile",

        componentDidMount: function () {
            this.refs.select.getDOMNode().blur();
        },
        componentDidUpdate: function () {
            this.refs.select.getDOMNode().blur();
        },

        handleSelect: function (evt) {
            var profileId = evt.target.value;
            if (profileId === "__add") {
                return;
            }
            var profile = this.props.profiles.filter(function (profile) {
                return profile.getId() === profileId;
            })[0];
            this.props.selectProfile(profile);
        },

        render: function () {
            var current = this.props.selectedProfile;
            var options = this.props.profiles.map(function (profile) {
                return React.DOM.option({key: profile.getId(), value: profile.getId(), className: "title"}, profile.getUsername());
            });
            options.push(React.DOM.optgroup({key: "__add", label: "───"},
                React.DOM.option({value: "__add", className: "title"}, "Add profile..."))
                );
            return React.DOM.div({ className: this.props.className },
                React.DOM.select({
                    ref: "select",
                    className: "title",
                    value: current.getId(),
                    onChange: this.handleSelect
                }, options)
                );
        }
    });
});