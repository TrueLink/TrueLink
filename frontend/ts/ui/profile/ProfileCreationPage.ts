"use strict";
import React = require("react");
import reactObserver = require("../../mixins/reactObserver");

function renderForm(submitHandler, children) {
    return React.DOM.div({className: "profile-creation-page app-page"},
        React.DOM.div({className: "app-page-content"},
            React.DOM.h1(null, "TrueLink"),
            React.DOM.form({
                    onSubmit: submitHandler
                },
                children,
                React.DOM.div({className: "separator"}),
                React.DOM.input({
                        type: "submit",
                        value: "All done"
                    })
                )
            )
        );
}

function renderFormElement(profile: any, labelText: string, hintText: string, profileField: string, disabled?: boolean, value?: string) {
    return [
            React.DOM.label(null, labelText),
            !hintText ? null : React.DOM.p({
                    className: "hint"
                }, hintText),
            React.DOM.input({
                type: "text",
                value: value || profile[profileField],
                onChange: disabled ? null : function (e) {
                    profile.set(profileField, (<any>e.target).value);
                },
                disabled: disabled
            })
        ];
}

var ProfileTypeChooser = React.createClass({
    displayName: "ProfileTypeChooser",

    _handleAnonymousType: function() {
        return this.props.handleAnonymousType();
    },

    _handlePseudoAnonymousType: function() {
        return this.props.handlePseudoAnonymousType();
    },

    _handlePublicType: function() {
        return this.props.handlePublicType();
    },
    
    _handleProfileSync: function() {
        return this.props.handleProfileSync();
    },

    render: function () {
        return React.DOM.div({className: "profile-creation-page app-page"},
            React.DOM.div({className: "app-page-content has-footer"},                                 
                React.DOM.h1(null, "TrueLink"),
                React.DOM.h2(null, "Create new profile:"),
                React.DOM.a({
                        className: "button profile-creation-anonymous",
                        href: "#",
                        onClick: this._handleAnonymousType
                    }, "Anonymous"),
                React.DOM.p({
                        className: "hint"
                    }, "Nothing is known about you. No one can initiate contact with you."),
                React.DOM.a({
                        className: "button profile-creation-pseudonymous",
                        href: "#",
                        onClick: this._handlePseudoAnonymousType
                    }, "Pseudonymous"),
                React.DOM.p({
                        className: "hint"
                    }, "Your contacts know nothing but your nickname. A link that allows initiating conacts with you is generated."),
                React.DOM.a({
                        className: "button profile-creation-public",
                        href: "#",
                        onClick: this._handlePublicType
                    }, "Public Account"),
                React.DOM.p({
                        className: "hint"
                    }, "Your contacts know your name, email and phone number. A link that allows initiating conacts with you is generated.")),
            React.DOM.div({ className: "app-page-footer" },
                React.DOM.p(null, "Or do you have a profile on another device already?"),
                React.DOM.a({
                    className: "button",
                    href: "#",
                    onClick: this._handleProfileSync
                }, "Sign into existing profile")));
    }
});

var AnonymousProfileForm = React.createClass({
    displayName: "AnonymousProfileForm",

    _handleProfileCreation: function() {
        return this.props.handleProfileCreation();
    },

    render: function () {
        return renderForm(this._handleProfileCreation,
            renderFormElement(this.props.pageModel.model,
                "Nickname:",
                "It will be displayed in profile selector. No one will see it but you.",
                "temporaryName"));
    }
});

var PseudonymousProfileForm = React.createClass({
    displayName: "PseudonymousProfileForm",

    _handleProfileCreation: function() {
        return this.props.handleProfileCreation();
    },

    _renderPublicKeyFormElement: function () {
        return [
            React.DOM.div({className: "separator"}),
            renderFormElement(this.props.pageModel.model,
                "Public key:",
                "Other people can initiate contacts with you using this key. You can manage your keys in settings later.",
                null,
                true,
                "XXXX-876B-GH6V-DFG8-K45Z-JHG3-XXXX")
        ];
    },

    render: function () {
        return renderForm(this._handleProfileCreation, [
            renderFormElement(this.props.pageModel.model,
                "Nickname:",
                "Your contacts will be able to see this name.",
                "temporaryName"),
            this._renderPublicKeyFormElement()
        ]);
    },
}); 

var PublicProfileForm = React.createClass({
    displayName: "PseudonymousProfileForm",

    _handleProfileCreation: function() {
        return this.props.handleProfileCreation();
    },

    _renderPublicKeyFormElement: function () {
        return [
            React.DOM.div({className: "separator"}),
            renderFormElement(this.props.pageModel.model,
                "Public key:",
                "Other people can initiate contacts with you using this key. You can manage your keys in settings later.",
                null,
                true,
                "XXXX-876B-GH6V-DFG8-K45Z-JHG3-XXXX")
        ];
    },

    render: function () {
        return renderForm(this._handleProfileCreation, [
            renderFormElement(this.props.pageModel.model, "Your name:", null, "temporaryName"),
            renderFormElement(this.props.pageModel.model, "Email:", null, "email"),
            renderFormElement(this.props.pageModel.model, "Phone number:", null, "phoneNumber"),
            React.DOM.p({
                    className: "hint"
            }, "Your contacts will be able to see this information."),                
            this._renderPublicKeyFormElement()
        ]);
    },
}); 

var SyncProfileForm = React.createClass({
    displayName: "SyncProfileForm",

    render: function () {
        var profile = this.props.pageModel.model;
        var sync = profile.sync;
        var connection = sync.initialConnection;
        return renderForm(this._handleProfileCreation, [
            renderFormElement(this.props.pageModel.model, "Enter auth:", null, "temporaryName"),
            React.DOM.p({
                    className: "hint"
            }, "Your contacts will be able to see this information.")
        ]);
    },
});

var exp = React.createClass({
    displayName: "ProfileCreationPage",
    mixins: [reactObserver],

    _handleProfileCreation: function () {
        var profile = this.props.pageModel.model;
        if (!profile.temporaryName) { return false; }
        profile.init({
            name: profile.temporaryName,
            bg: profile.app._getNextBgIndex(),
            serverUrl: profile.app.defaultPollingUrl
        });
        //todo navigate to help here
        this.props.router.navigate("home", profile.app);
        return false;
    },

    _handleProfileTypeChoosen: function(profileType) {
        var profile = this.props.pageModel.model;
        profile.set("publicityType", profileType);
        this.setState({});
        return false;
    },

    _handleProfileSync: function() {
        var profile = this.props.pageModel.model;
        profile.startSyncing({
            serverUrl: profile.app.defaultPollingUrl
            });
        this.setState({});
        return false;
    },

    render: function () {
        var router = this.props.router;
        var profile = this.props.pageModel.model;


        if(profile.sync) {
            return SyncProfileForm({
                pageModel: this.props.pageModel
            });
        }

        switch (profile.publicityType) {
            case "anonymous": {
                return AnonymousProfileForm({
                    handleProfileCreation: this._handleProfileCreation,
                    pageModel: this.props.pageModel
                });
            }
            case "pseudonymous": {
                return PseudonymousProfileForm({
                    handleProfileCreation: this._handleProfileCreation,
                    pageModel: this.props.pageModel
                });
            }
            case "public": {
                return PublicProfileForm({
                    handleProfileCreation: this._handleProfileCreation,
                    pageModel: this.props.pageModel
                });
            }
        }

        return ProfileTypeChooser({
            handleAnonymousType: this._handleProfileTypeChoosen.bind(this, "anonymous"),
            handlePseudoAnonymousType: this._handleProfileTypeChoosen.bind(this, "pseudonymous"),
            handlePublicType: this._handleProfileTypeChoosen.bind(this, "public"),
            handleProfileSync: this._handleProfileSync,
        });
    }
});

export = exp;
