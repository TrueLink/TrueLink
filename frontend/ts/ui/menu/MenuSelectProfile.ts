    "use strict";

    import React = require("react");

    var exp = React.createClass({
        displayName: "MenuSelectProfile",
        propTypes:{
            addProfile: React.PropTypes.func.isRequired,
        },

        handleSelect: function (evt) {
            var value = evt.target.value;
            if (value === "__add") {
                this.props.addProfile();
                return;
            }
            var profile = this.props.profiles.filter(function (profile) {
                return profile.uuid === value;
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
                var name = profile.name;
                if (name) {
                    if (profile.unreadCount != 0) {
                        name += " (" + profile.unreadCount + ")";
                    }
                } else {
                    name = "(continue creation)";
                    if (profile.temporaryName) {
                        name = profile.temporaryName + " " + name;
                    }
                }

                return React.DOM.option({
                    key: profile.uuid,
                    value: profile.uuid,
                    className: "title"
                }, name);
            });
            options.push(React.DOM.optgroup({key: "__add", label: "───"},
                React.DOM.option({value: "__add", className: "title"}, "Add profile..."))
                );
            return React.DOM.div({ className: this.props.className },
                React.DOM.select({
                    ref: "select",
                    className: "title",
                    value: (current) ? (current.uuid) : "none",
                    onChange: this.handleSelect
                }, options)
                );
        }
    });
export = exp;
