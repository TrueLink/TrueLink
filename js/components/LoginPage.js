(function ($, Q, modules, React) {
    "use strict";

    modules.LoginPage = React.createClass({
        displayName: "LoginPage",

        login: function () {
            this.props.app.changeState(modules.HomePage, {test: "123"});
        },

        render: function () {
            return React.DOM.div(null,
                this.props.message ? this.props.message + " " : null,
                React.DOM.a({onClick: this.login}, "Login"));
        }
    });
}(Zepto, Q, _modules, React));