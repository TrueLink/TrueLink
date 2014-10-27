"use strict";
import React = require("react");
import reactObserver = require("../../mixins/reactObserver");
var exp = React.createClass({
    displayName: "ProfileCreationPage",
    mixins: [reactObserver],

    _handleProfileTypeChoice: function (profileType: string) {
        var profile = this.props.pageModel.model;
        profile.set("publicityType", profileType);
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
                        onClick: this._handleProfileTypeChoice.bind(this, "anonymous")
                    }, "Anonymous"),
                React.DOM.p({
                        className: "hint"
                    }, "Nothing is known about you. No one can initiate contact with you."),
                React.DOM.a({
                        className: "button profile-creation-pseudonymous",
                        href: "#",
                        onClick: this._handleProfileTypeChoice.bind(this, "pseudonymous")
                    }, "Pseudonymous"),
                React.DOM.p({
                        className: "hint"
                    }, "Your contacts know nothing but your nickname. A link that allows initiating conacts with you is generated."),
                React.DOM.a({
                        className: "button profile-creation-public",
                        href: "#",
                        onClick: this._handleProfileTypeChoice.bind(this, "public")
                    }, "Public Account"),
                React.DOM.p({
                        className: "hint"
                    }, "Your contacts know your name, email and phone number. A link that allows initiating conacts with you is generated.")),
            React.DOM.div({ className: "app-page-footer" },
                React.DOM.p(null, "Or do you have a profile on another device already?"),
                React.DOM.a({
                    className: "button",
                    href: "#",
                    onClick: function () {
                        alert("Not implemented!");
                        return false;
                    }
                }, "Sign into existing profile")));
    },

    _renderForm: function (submitHandler, children) {
        return React.DOM.div({className: "profile-creation-page app-page"},
            React.DOM.div({className: "app-page-content"},
                React.DOM.h1(null, "TrueLink"),
                React.DOM.form({
                        onSubmit: submitHandler
                    },
                    children,
                    React.DOM.input({
                            type: "submit",
                            value: "All done"
                        }))));
    },

    _renderFormElement: function (labelText: string, hintText: string, profileField: string, disabled?: boolean, value?: string) {
        var profile = this.props.pageModel.model;
        return [
                React.DOM.label(null, labelText),
                !hintText ? null : React.DOM.p({
                        className: "hint"
                    }, hintText),
                React.DOM.input({
                        type: "text",
                        value: value || profile[profileField],
                        onChange: disabled ? null : function (e) {
                            profile.set(profileField, e.target.value);
                        },
                        disabled: disabled
                    })
            ];
    },

    _handleProfileCreation: function () {
        var profile = this.props.pageModel.model;
        profile.init({
            name: profile.temporaryName,
            bg: profile.app._getNextBgIndex(),
            serverUrl: profile.app.defaultPollingUrl
        });
        //todo navigate to help here
        this.props.router.navigate("home", profile.app);
        return false;
    },



    _renderAnonymousProfileForm: function () {
        return this._renderForm(this._handleProfileCreation,
            this._renderFormElement(
                "Nickname:",
                "It will be displayed in profile selector. No one will see it but you.",
                "temporaryName"));
    },

    _renderPublicKeyFormElement: function () {
        return this._renderFormElement(
            "Public key:",
            "Other people can initiate contacts with you using this key. You can manage your keys in settings later.",
            null,
            true,
            "XXXX-876B-GH6V-DFG8-K45Z-JHG3-XXXX");
    },

    _renderPseudonymousProfileForm: function () {
        return this._renderForm(this._handleProfileCreation, [
                this._renderFormElement(
                    "Nickname:",
                    "Your contacts will be able to see this name.",
                    "temporaryName"),
                this._renderPublicKeyFormElement()
            ]);
    },

    _renderPublicProfileForm: function () {
        return this._renderForm(this._handleProfileCreation, [
                this._renderFormElement("Your name:", null, "temporaryName"),
                this._renderFormElement("Email:", null, "email"),
                this._renderFormElement("Phone number:", null, "phoneNumber"),
                React.DOM.p({
                        className: "hint"
                }, "Your contacts will be able to see this information."),                
                this._renderPublicKeyFormElement()
            ]);
    },

    render: function () {
        var router = this.props.router;
        var profile = this.props.pageModel.model;

        switch (profile.publicityType) {
            case "anonymous": {
                return this._renderAnonymousProfileForm();
            }
            case "pseudonymous": {
                return this._renderPseudonymousProfileForm();
            }
            case "public": {
                return this._renderPublicProfileForm();
            }
            default: {
                return this._renderProfileTypeChooser();
            }
        }
    }
});

export = exp;
