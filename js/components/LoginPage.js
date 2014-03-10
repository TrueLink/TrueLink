define(["zepto", "q", "react"], function ($, Q, React) {

    "use strict";

    return React.createClass({
        displayName: "LoginPage",

        login: function () {
            this.props.login(this.refs.login.value);
        },

        render: function () {
            return React.DOM.div(null,
                React.DOM.input({ref: "login"})
            );
        }
    });
});