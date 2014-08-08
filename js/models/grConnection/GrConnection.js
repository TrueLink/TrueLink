define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var Hex = require("modules/multivalue/hex");
    var TlecBuilder = require("modules/channels/TlecBuilder");

    function GrConnection() {
        this._defineEvent("changed");
        this._defineEvent("user_joined");
        this._defineEvent("user_left");
        this._defineEvent("message");

        this._activeTlgr = null;
        this._transport = null;
    }

    //interface IGrConnectionInitParams {
    //
    //}
    extend(GrConnection.prototype, eventEmitter, serializable, model, {
        //called when creating totally new connection (not when deserialized)
        init: function (args) {
            this._transport = args.transport;
            this._activeTlgr = this._factory.createTlgr();

            this._activeTlgr.init({
                invite: args.invite,
                userName: args.userName
            });

            this._activeTlgr.on("packet", function (packet/*{addr, data}*/) {
                this._transport.sendPacket(packet);
            }.bind(this), this._activeTlgr);
            this._setTlgrEventHandlers(this._activeTlgr);
        },

        getMyAid: function () {
            return this._activeTlgr.getMyAid();
        },

        sendMessage: function (message) {
            this._activeTlgr.sendMessage(message);
        },

        _handleOpenAddrIn: function (args) {
            console.log("Tlgr openAddrIn");
            var _couchAdapter = new CouchAdapter(this.profile.transport, {
                context: args.context,
                addr: args.addr,
                since: this.since
               //was pretty bad idea to do this->  since: this.transport.getSince()
            });
            this.adapter = _couchAdapter;
            _couchAdapter.on("packet", this._activeTlgr.onNetworkPacket, this._activeTlgr);
            _couchAdapter.on("changed", function (obj) {
                this.fire("changed", this);
            }, this);
            _couchAdapter.run();
        },

        _handleCloseAddrIn: function (args) {
            if (this.adapter) {
                this.adapter.off("packet", this._activeTlgr.onNetworkPacket, this._activeTlgr);
                this.adapter.destroy();
                this.adapter = null;
            }
        },

        _handleUserJoined: function (user) {
            this.fire("user_joined", user, this);
        },

        _handleUserLeft: function (user) {
            this.fire("user_left", user, this);
        },

        _handleMessage: function (msg) {
            this.fire("message", msg, this);
        },

        destroy: function () {
            if (this.adapter) {
                this.adapter.off("packet", this.activeTlgr.onNetworkPacket, this.activeTlgr);
                //this.adapter.off("changed");
                this.adapter.destroy();
                this.adapter = null;
            }
            if (this.activeTlgr) {
                this.activeTlgr.sendChannelAbandoned();
                //this.tlgr.off("message");
                //this.tlgr.off("user_joined");
                //this.tlgr.off("user_left");
                //this.tlgr.off("openAddrIn");
                this.activeTlgr = null;
            }
        },

        _setTlgrEventHandlers: function (tlgr) {
            tlgr.on("openAddrIn", this._handleOpenAddrIn, this);
            tlgr.on("closeAddrIn", this._handleCloseAddrIn, this);
            tlgr.on("message", this._handleMessage, this);
        },

        serialize: function (packet, context) {
            packet.setData({
                since: (this.adapter) ? (this.adapter._since) : 0
            });
            packet.setLink("activeTlgr", context.getPacket(this.activeTlgr));
        },

        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            this.since = packet.getData().since;
            this.activeTlgr = context.deserialize(packet.getLink("activeTlgr"), factory.createTlgr, factory);
        },
    })
});

