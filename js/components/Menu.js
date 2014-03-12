define(["zepto", "q", "react", "components/menu/MenuSelectProfile"], function ($, Q, React, MenuSelectProfile) {
    "use strict";

    return React.createClass({
        displayName: "Menu",

        handleSelectProfile: function (profile) {
            this.props.app.changeState(null, {currentProfile: profile});
        },

        render: function () {
            var app = this.props.app;

            app.profiles = [
                {id: "gr", name: "prof1", getData: function () { return "1"; }},
                {id: "df", name: "prof2", getData: function () { return "2"; }}
            ];
            app.currentProfile = app.currentProfile || app.profiles[1];

            return React.DOM.div({className: this.props.className},
                MenuSelectProfile({
                    className: "profile-selector",
                    profiles: app.profiles,
                    selectedProfile: app.currentProfile,
                    selectProfile: this.handleSelectProfile
                })
                );
        }
    });
});