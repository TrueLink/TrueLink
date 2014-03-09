define(["zepto", "q", "react", "components/menu/MenuSelectProfile"], function ($, Q, React, MenuSelectProfile) {
    "use strict";

    return React.createClass({
        displayName: "Menu",

        render: function () {
            var app = this.props.app;
            return React.DOM.div({id: "menu"},
                MenuSelectProfile({profileList: app.profiles, selectedProfile: app.currentProfile})
                );
        }
    });
});