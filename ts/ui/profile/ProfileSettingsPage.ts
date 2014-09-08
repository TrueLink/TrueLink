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
                React.DOM.div(null, "Profile Settings: " + profile.name),
                React.DOM.div({className: "app-page-content has-header"},
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
