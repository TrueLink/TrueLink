"use strict";
import React = require("react");
var exp = React.createClass({
    displayName: "ProfileCreationMainPage",
    render: function () {
        return React.DOM.div({
                className: "profile-creation"
            },
            React.DOM.h1(null, "TrueLink"),
            React.DOM.h2(null, "Create new profile:"),
            React.DOM.a({
                    className: "button profile-creation-anonymous",
                    href: "#"
                }, "Anonymous"),
            React.DOM.p(null, "Nothing is known about you. No one can initiate contact with you."),
            React.DOM.a({
                    className: "button profile-creation-pseudonymous",
                    href: "#"
                }, "Pseudonymous"),
            React.DOM.p(null, "Your contacts know nothing but your nickname. A link that allows initiating conacts with you is generated."),
            React.DOM.a({
                    className: "button profile-creation-public",
                    href: "#"
                }, "Public Account"),
            React.DOM.p(null, "Your contacts know your name, email and phone number. A link that allows initiating conacts with you is generated."),
            React.DOM.div({
                    className: "profile-creation-footer"
                },
                React.DOM.p(null, "Do you have a profile on another device already?"),
                React.DOM.a({
                    className: "button",
                    href: "#"
                }, "Sign into existing profile")));
    }
});
export = exp;
