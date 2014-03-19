define(["zepto", "q", "react", "components/ChannelsTestPage"], function ($, Q, React, ChannelsTestPage) {

    "use strict";

    return React.createClass({
        displayName: "LoginPage",

        componentDidMount: function () {
            this.refs.login.getDOMNode().focus();
        },
        login: function () {
            this.props.login(this.refs.login.getDOMNode().value);
            return false;
        },
        goTest: function () {
            this.props.app.changeState(ChannelsTestPage({app: this.props.app}));
        },
        render: function () {
            return React.DOM.div({className: "default-background-dark login-form"},
                React.DOM.form({onSubmit: this.login},
                    React.DOM.input({ref: "login", type: "text"}),
                    !this.props.error ? null :
                            React.DOM.div(null, this.props.error)
                    ),
                React.DOM.br(null),
                React.DOM.button({onClick: this.goTest}, "test Channels"));
        }
    });
});