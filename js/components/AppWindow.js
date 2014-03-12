define(["react", "components/Menu"], function (React, Menu) {
    "use strict";

    return React.createClass({
        render: function () {
            var currentProfile = this.props.app.currentProfile;
            var pageCustomClass = !currentProfile ? "" :
                    " stretch-background user-background-" + currentProfile.getData("bg");
            return React.DOM.div({id: "app"},
                Menu({className: "app-menu", app: this.props.app}),
                React.DOM.div({className: "app-page" + pageCustomClass},
                    this.props.currentPage));
        }
    });
});
