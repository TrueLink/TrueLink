(function ($, Q, modules, React) {
    "use strict";

    modules.HomePage = React.createClass({
        displayName: "HomePage",

        logout: function () {
            this.props.app.changeState(modules.LoginPage, {message: "LoggedOut"});
        },

        render: function () {
            return React.DOM.div(null,
                this.props.test + " ",
                React.DOM.a({onClick: this.logout}, "Logout"));
        }
    });
}(Zepto, Q, _modules, React));