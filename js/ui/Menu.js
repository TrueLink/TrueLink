define(["zepto", "q", "react", "components/menu/MenuSelectProfile"], function ($, Q, React, MenuSelectProfile) {
    "use strict";

    return React.createClass({
        displayName: "Menu",

        handleSelectProfile: function (profile) {
            this.props.app.changeState(null, {currentProfile: profile});
        },

        render: function () {
            var app = this.props.app;
            return React.DOM.div({className: this.props.className},
                !app.profiles ? null : MenuSelectProfile({
                    className: "profile-selector",
                    profiles: app.profiles,
                    selectedProfile: app.currentProfile,
                    selectProfile: this.handleSelectProfile
                })
                );
        }
    });
});