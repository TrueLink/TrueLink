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
        return false;
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
                        className: "hint"
                    }, "Nothing is known about you. No one can initiate contact with you."),
                React.DOM.a({
                        className: "button profile-creation-pseudonymous",
                        href: "#",
                        onClick: function () { this._handleProfileTypeChoice("pseudonymous"); }.bind(this)
                    }, "Pseudonymous"),
                React.DOM.p({
                        className: "hint"
                    }, "Your contacts know nothing but your nickname. A link that allows initiating conacts with you is generated."),
                React.DOM.a({
                        className: "button profile-creation-public",
                        href: "#",
                        onClick: function () { return this._handleProfileTypeChoice("public"); }.bind(this)
                    }, "Public Account"),
                React.DOM.p({
                        className: "hint"
                    }, "Your contacts know your name, email and phone number. A link that allows initiating conacts with you is generated.")),
            React.DOM.div({ className: "app-page-footer" },
                React.DOM.p(null, "Or do you have a profile on another device already?"),
                React.DOM.a({
                    className: "button",
                    href: "#"
                }, "Sign into existing profile")));
    },

    _handleAnonymousProfileCreation: function() {
        var profile = this.state.model;
        profile.init({
            name: this.refs.nickname.getDOMNode().value,
            bg: profile.app._getNextBgIndex(),
            serverUrl: profile.app.defaultPollingUrl
        });
        //todo navigate to help here
        this.props.router.navigate("home", profile.app);
        return false;
    },

    _renderAnonymousProfileForm: function() {
        var router = this.props.router;
        var profile = this.state.model;
        return React.DOM.div({className: "profile-creation-page app-page"},
            React.DOM.div({className: "app-page-content"},
                React.DOM.h1(null, "TrueLink"),
                React.DOM.form({
                        onSubmit: this._handleAnonymousProfileCreation
                    },
                    React.DOM.label(null, "Nickname:"),
                    React.DOM.p({
                            className: "hint"
                        }, "It will be displayed in profile chooser. No one but you will see it."),
                    React.DOM.input({
                            type: "text",
                            ref: "nickname",
                            value: profile.temporaryName,
                            onChange: function (e) {
                                profile.temporaryName = e.target.value;
                            }
                        }),
                    React.DOM.input({
                            type: "submit",
                            value: "All done"
                        }))));
    },
    
    _render: function () {
        return React.DOM.div({className: "profile-creation-page app-page"},
            React.DOM.div({className: "app-page-content"},
                React.DOM.h1(null, "TrueLink"),
                React.DOM.form(null,
                    React.DOM.label(null, "Nickname:"),
                    React.DOM.p({
                            className: "hint"
                        }, "This is the name your [собеседник] will see."),
                    React.DOM.input({
                            type: "text"
                        }),
                    React.DOM.label(null, "Public key:"),
                    React.DOM.p({
                            className: "hint"
                        }, "Other people can initiate contacts with you using this key. You can manage your keys in settings later."),
                    React.DOM.input({
                            type: "text",
                            value: "XXXX-876B-GH6V-DFG8-K45Z-JHG3-XXXX",
                            disabled: true
                        }),
                    React.DOM.input({
                            type: "submit",
                            value: "All done"
                        }))));
    },

    render: function () {
        var router = this.props.router;
        var profile = this.state.model;

        switch (profile.publicityType) {
            case "anonymous": {
                return this._renderAnonymousProfileForm();
            }
            case "pseudonymous": {
                return this._render();
            }
            case "public": {
                return this._render();
            }
            default: {
                return this._renderProfileTypeChooser();
            }
        }
    }
});

export = exp;
