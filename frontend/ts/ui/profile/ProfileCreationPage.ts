"use strict";
import React = require("react");
import reactObserver = require("../../mixins/reactObserver");
import Tlec = require("Tlec");
var TlecBuilder = Tlec.Builder;
    
import multivalue = require("Multivalue");
var DecBlocks = multivalue.DecBlocks;

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
                React.DOM.h1({id:"tlTitle"}, "TrueLink"),
                React.DOM.h2(null, "Create new profile:"),
                React.DOM.a({
                        className: "button profile-creation-anonymous",
                        href: "#",
                        onClick: this._handleAnonymousType
                    }, "Anonymous"),
                React.DOM.p({
                        className: "hint"
                    }, "Nothing is known about you."),
                React.DOM.p({
                        className: "hint"
                    }, "NOTE: Development mode - History encryption disabled."),
                React.DOM.a({
                        className: "button profile-creation-pseudonymous",
                        href: "#",
                        onClick: this._handlePseudoAnonymousType
                    }, "Pseudonymous [N/A]"),
                React.DOM.p({
                        className: "hint"
                    }, "People can find you by your nickname or public key."),
                React.DOM.a({
                        className: "button profile-creation-public",
                        href: "#",
                        onClick: this._handlePublicType
                    }, "Public Account [N/A]"),
                React.DOM.p({
                        className: "hint"
                    }, "Publish your name, email and phone number. You'll get a link to your profile.")),
            React.DOM.div({ className: "app-page-footer" },
                React.DOM.p(null, "Already using TrueLink?"),
                React.DOM.a({
                    id: "create-synced-profile-button",
                    className: "button",
                    href: "#",
                    onClick: this._handleProfileSync
                }, "Sync this device")));
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

    componentDidMount: function () {
        var profile = this.props.pageModel.model;
        var sync = profile.sync;
        var connection = sync.initialConnection;
        connection.on("changed", this.props.pageModel._onChanged, this.props.pageModel);
        sync.onJoinedToSync.on(this._handleJoined, this);
    },

    componentWillUnmount: function () {
        var profile = this.props.pageModel.model;
        var sync = profile.sync;
        var connection = sync.initialConnection;
        connection.off("changed", this.props.pageModel._onChanged, this.props.pageModel);
        sync.onJoinedToSync.off(this._handleJoined, this);
    },

    handleOfferInput: function () {
        var profile = this.props.pageModel.model;
        var sync = profile.sync;
        var connection = sync.initialConnection;

        var offer = DecBlocks.fromString(this.refs.offer.getDOMNode().value);
        connection.enterOffer(offer);
    },

    handleAuthInput: function () {
        var profile = this.props.pageModel.model;
        var sync = profile.sync;
        var connection = sync.initialConnection;

        var offer = DecBlocks.fromString(this.refs.auth.getDOMNode().value);
        connection.enterAuth(offer);
    },

    _handleJoined: function() {
        var profile = this.props.pageModel.model;
        profile.temporaryName = "to be synced";
        this.props.handleProfileCreation();
    },

    renderStatus: function (status) {
        var tlStatus: string = "";
        switch (status) {
            case TlecBuilder.STATUS_NOT_STARTED:
                return React.DOM.div(null,
                    React.DOM.label(null, "Offer:", 
                        React.DOM.br(),
                        React.DOM.input({
                            id: "sync-profile-offer-field",
                            ref: "offer"
                        })),
                    React.DOM.div(null, 
                        React.DOM.button({
                            id: "sync-profile-accept-offer-button",
                            onClick: this.handleOfferInput
                        }, "Accept offer")));
            case TlecBuilder.STATUS_OFFER_GENERATED:
                tlStatus = "Offer provided";
                break;
            case TlecBuilder.STATUS_AUTH_GENERATED:
                tlStatus = "Offer and Auth provided";
                break;
            case TlecBuilder.STATUS_AUTH_ERROR:
                tlStatus = "Auth error";
                break;
            case TlecBuilder.STATUS_OFFERDATA_NEEDED:
                tlStatus = "Waiting for response (offer data)";
                break;
            case TlecBuilder.STATUS_AUTHDATA_NEEDED:
                tlStatus = "Waiting for response (auth data)";
                break;
            case TlecBuilder.STATUS_AUTH_NEEDED:
                return React.DOM.div(null,
                    React.DOM.label(null, "Auth:", 
                        React.DOM.br(),
                        React.DOM.input({
                            id: "sync-profile-auth-field",
                            ref: "auth"
                        })),
                    React.DOM.div(null, 
                        React.DOM.button({
                            id: "sync-profile-accept-auth-button",
                            onClick: this.handleAuthInput
                        }, "Accept auth")));
            case TlecBuilder.STATUS_HT_EXCHANGE:
                tlStatus = "Hashtail exchange";
                break;
            case TlecBuilder.STATUS_ESTABLISHED:
                tlStatus = "Established";
                break;
        }
        return React.DOM.label(null, "Status: " + tlStatus);
    },

    render: function () {
        var profile = this.props.pageModel.model;
        var sync = profile.sync;
        var connection = sync.initialConnection;
        var status = connection.getStatus();
        return this.renderStatus(status);
    }
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
                handleProfileCreation: this._handleProfileCreation,
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
