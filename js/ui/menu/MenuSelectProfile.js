define(function (require, exports, module) {
    "use strict";

    var React = require("react");

    module.exports = React.createClass({
        displayName: "MenuSelectProfile",

        handleSelect: function (evt) {
            var value = evt.target.value;
            if (value === "__add") {
                this.props.addProfile();
                return;
            }
            var profile = this.props.profiles.filter(function (profile) {
                return profile.name === value;
            })[0];
            this.props.selectProfile(profile);
        },

        componentDidMount: function () {
            this.refs.select.getDOMNode().blur();
        },
        componentDidUpdate: function () {
            this.refs.select.getDOMNode().blur();
        },

        render: function () {

            var current = this.props.currentProfile;
            var options = this.props.profiles.map(function (profile) {
                return React.DOM.option({key: profile.name, value: profile.name, className: "title"}, profile.name);
            });
            options.push(React.DOM.optgroup({key: "__add", label: "───"},
                React.DOM.option({value: "__add", className: "title"}, "Add profile..."))
                );
            return React.DOM.div({ className: this.props.className },
                React.DOM.select({
                    ref: "select",
                    className: "title",
                    value: current.name,
                    onChange: this.handleSelect
                }, options)
                );
        }
    });
});