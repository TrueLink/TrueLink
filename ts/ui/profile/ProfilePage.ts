    "use strict";
    var React = require("react");
    var reactObserver = require("mixins/reactObserver");
    export = React.createClass({
        displayName: "ProfilePage",
        mixins: [reactObserver],
        render: function () {
            var profile = this.state.model;
//            var router = this.props.router;
            return React.DOM.div(null, "Profile Settings: " + profile.name);
        }
    });
