define(["zepto",
    "react",
    "tools/bind",
    "components/AppWindow",
    "components/Menu",
    "views"
    ], function ($, React, bind, AppWindow, Menu) {
    "use strict";


    return React.createClass({
        displayName: "App",
        mixins: [bind],

        getInitialState: function () {
            return {
                currentProfile: null,
                currentPage: null
            };
        },

        navigate: function (guid, viewName) {

        },

        componentDidMount: function () {
            // just go home

        },

        render: function () {
            var profile = this.state.currentProfile;
            return AppWindow({
                currentProfile: profile,
                menu: Menu({currentProfile: profile, rootEntity: this.props.rootEntity}),
                currentPage: this.state.currentPage
            });
        }
    });
});
