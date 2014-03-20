define(["react", "components/Menu"], function (React, Menu) {
    "use strict";

    return React.createClass({
        render: function () {
            var currentProfile = this.props.currentProfile;
            var pageCustomClass = !currentProfile ? "" :
                    " stretch-background user-background-" + currentProfile.getData("bg");
            return React.DOM.div({id: "app"},
                this.props.menu,
                React.DOM.div({className: "app-page" + pageCustomClass},
                    this.props.currentPage));
        }
    });
});
