"use strict";
import React = require("react");
import Profile = require("../../models/Profile");
import reactObserver = require("../../mixins/reactObserver");
import Tlec = require("Tlec");
var TlecBuilder = Tlec.Builder;
    
import multivalue = require("Multivalue");
var DecBlocks = multivalue.DecBlocks;

var ProfileSyncPage = React.createClass({
    displayName: "ProfileSyncPage",
    mixins: [reactObserver],

    componentDidMount: function () {
        var profile = this.props.pageModel.model;
        var sync = profile.sync;
        sync.on("changed", this._onModelChanged, this);
        sync.grConnection.on("changed", this._onModelChanged, this);

        var max = sync.tlConnections.length;
        for (var i = 0; i < max; i++){
            var connection = sync.tlConnections[i];
            connection.on("changed", this._onModelChanged, this);
        }
    },

    componentWillUnmount: function () {
        var profile = this.props.pageModel.model;
        var sync = profile.sync;
        sync.off("changed", this._onModelChanged, this);
        sync.grConnection.off("changed", this._onModelChanged, this);

        var max = sync.tlConnections.length;
        for (var i = 0; i < max; i++){
            var connection = sync.tlConnections[i];
            connection.off("changed", this._onModelChanged, this);
        }
    },

    _handleNewSync: function() {
        var profile = this.props.pageModel.model;
        var sync = profile.sync;
        var connection = sync.startSlaveConnection();
        connection.on("changed", this._onModelChanged, this);
        return false;
    },

    _renderConnectionStatus: function (tlConnection) {
        var tlStatus: string = "";
        var status = tlConnection.getStatus();
        switch (status) {
            case TlecBuilder.STATUS_NOT_STARTED:
                tlStatus = "Not connected";
                break;
            case TlecBuilder.STATUS_OFFER_GENERATED:
                var offer = tlConnection.offer ? tlConnection.offer.as(DecBlocks).toString() : null;
                return React.DOM.div(null,
                    React.DOM.label(null, "Offer:", 
                        React.DOM.br(), 
                        React.DOM.input({
                            id: "sync-offer-field",
                            readOnly: true, 
                            value: offer
                            })));
            case TlecBuilder.STATUS_AUTH_GENERATED:
                var auth =  tlConnection.auth ? tlConnection.auth.as(DecBlocks).toString() : null;
                return React.DOM.div(null,
                    React.DOM.label(null, "Auth:", 
                        React.DOM.br(), 
                        React.DOM.input({
                            id: "sync-auth-field",
                            readOnly: true, 
                            value: auth
                        })));
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
                tlStatus = "Auth needed";
                break;
            case TlecBuilder.STATUS_HT_EXCHANGE:
                tlStatus = "Hashtail exchange";
                break;
            case TlecBuilder.STATUS_ESTABLISHED:
                tlStatus = "Established";
                break;
        }
        return React.DOM.label(null, "Status: " + tlStatus);
    },

    _renderConnectedStatus(device) {
        return React.DOM.div(null, "Connected: " + device.name);
    },

    render: function () {
        var profile = this.props.pageModel.model;
        var router = this.props.router;
        var sync = profile.sync;
        var max = sync.tlConnections.length;

        return React.DOM.div(null, 
            React.DOM.div({className: "app-page-header"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("home", profile.app)
                    }, "Sync Configuration for " + profile.name)),
            React.DOM.div({ className: "app-page-content has-header" },
                sync.tlConnections.map(this._renderConnectionStatus),
                sync.devices.map(this._renderConnectedStatus),
                React.DOM.a({
                    id: "add-device-button", 
                    className: "button",
                    href: "#",
                    onClick: this._handleNewSync
                    }, "Add Device")
                )
            );
    }
});
export = ProfileSyncPage;
