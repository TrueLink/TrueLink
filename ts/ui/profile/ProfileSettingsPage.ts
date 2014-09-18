    "use strict";
    import EditableField = require("ui/common/EditableField");
    import React = require("react");
    import reactObserver = require("mixins/reactObserver");
    var e = React.createClass({
        displayName: "ProfileSettingsPage",
        mixins: [reactObserver],
        render: function () {
            var profile = this.state.model;
            return React.DOM.div(null, 
                React.DOM.div({className: 'pageTitle'}, "Settings for " + profile.name),
                React.DOM.div({className: "app-page-content has-header"},
                    EditableField({
                        id: "profileName",
                        onChanged: profile.set.bind(profile, "name"),
                        label: "Profile Name (My Name): ",
                        value: profile.name
                    }),
                    EditableField({
                        id: "serverUrl",
                        onChanged: profile.set.bind(profile, "serverUrl"),
                        label: "Server URL: ",
                        value: profile.serverUrl
                    }))
                );
        }
    });
export = e;
