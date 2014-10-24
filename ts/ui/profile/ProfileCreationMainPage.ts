"use strict";
import React = require("react");
var exp = React.createClass({
    displayName: "ProfileCreationMainPage",
    render: function () {
        var router = this.props.router;
        //var profile = this.state.model;

        return  React.DOM.div({className: "profile-creation-page app-page"},
            React.DOM.div({className: "app-page-content has-footer"},                                 
                React.DOM.h1(null, "TrueLink"),
                React.DOM.h2(null, "Create new profile:"),
                React.DOM.a({
                        className: "button profile-creation-anonymous",
                        href: "#"
                    }, "Anonymous"),
                React.DOM.p({
                        className: "description"
                    }, "Nothing is known about you. No one can initiate contact with you."),
                React.DOM.a({
                        className: "button profile-creation-pseudonymous",
                        href: "#"
                    }, "Pseudonymous"),
                React.DOM.p({
                        className: "description"
                    }, "Your contacts know nothing but your nickname. A link that allows initiating conacts with you is generated."),
                React.DOM.a({
                        className: "button profile-creation-public",
                        href: "#"
                    }, "Public Account"),
                React.DOM.p({
                        className: "description"
                    }, "Your contacts know your name, email and phone number. A link that allows initiating conacts with you is generated.")),
            React.DOM.div({ className: "app-page-footer" },
                React.DOM.p(null, "Or do you have a profile on another device already?"),
                React.DOM.a({
                    className: "button",
                    href: "#"
                }, "Sign into existing profile")));
    }
});
export = exp;
