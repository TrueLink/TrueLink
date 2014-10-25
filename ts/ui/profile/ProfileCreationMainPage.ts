"use strict";
import React = require("react");
import reactObserver = require("../../mixins/reactObserver");
var exp = React.createClass({
    displayName: "ProfileCreationMainPage",
    mixins: [reactObserver],

    _handleProfileTypeChoice: function (profileType: string) {
        var profile = this.state.model;
        profile.publicityType = profileType;
        this.setState({});
    },

    _renderProfileTypeChooser: function () {
        return React.DOM.div({className: "profile-creation-page app-page"},
            React.DOM.div({className: "app-page-content has-footer"},                                 
                React.DOM.h1(null, "TrueLink"),
                React.DOM.h2(null, "Create new profile:"),
                React.DOM.a({
                        className: "button profile-creation-anonymous",
                        href: "#",
                        onClick: function () { this._handleProfileTypeChoice("anonymous"); }.bind(this)
                    }, "Anonymous"),
                React.DOM.p({
                        className: "description"
                    }, "Nothing is known about you. No one can initiate contact with you."),
                React.DOM.a({
                        className: "button profile-creation-pseudonymous",
                        href: "#",
                        onClick: function () { this._handleProfileTypeChoice("pseudonymous"); }.bind(this)
                    }, "Pseudonymous"),
                React.DOM.p({
                        className: "description"
                    }, "Your contacts know nothing but your nickname. A link that allows initiating conacts with you is generated."),
                React.DOM.a({
                        className: "button profile-creation-public",
                        href: "#",
                        onClick: function () { this._handleProfileTypeChoice("public"); }.bind(this)
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
    },
    
    _render: function () {
        return React.DOM.div({className: "profile-creation-page app-page"},
            React.DOM.div({className: "app-page-content"}                                 
                ));
    },

    render: function () {
        var router = this.props.router;
        var profile = this.state.model;

        return profile.publicityType
            ? this._render()
            : this._renderProfileTypeChooser();
    }
});

export = exp;
