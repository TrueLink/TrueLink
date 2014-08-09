define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var serializable = require("modules/serialization/serializable");
    var model = require("mixins/model");
    var Hex = require("modules/multivalue/hex");
    var TlecBuilder = require("modules/channels/TlecBuilder");
    var CouchAdapter = require("models/tlConnection/CouchAdapter");

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
            
            this._setTlgrEventHandlers(this._activeTlgr);

            this._activeTlgr.init({
                invite: args.invite,
                userName: args.userName
            });
            this.fire("changed", this);
        },

        getMyAid: function () {
            return this._activeTlgr.getMyAid();
        },

        sendMessage: function (message) {
            this._activeTlgr.sendMessage(message);
        },

        _handleOpenAddrIn: function (args) {
            console.log("Tlgr openAddrIn");
            var _couchAdapter = new CouchAdapter(this._transport, {
                context: args.context,
                addr: args.addr,
                since: this.since
               //was pretty bad idea to do this->  since: this.transport.getSince()
            });
            this.adapter = _couchAdapter;
            _couchAdapter.on("packet", this._activeTlgr.onNetworkPacket, this._activeTlgr);
            _couchAdapter.on("changed", this._onChanged, this);
            _couchAdapter.run();
        },

        _handleCloseAddrIn: function (args) {
            if (this.adapter) {
                this.adapter.off("packet", this._activeTlgr.onNetworkPacket, this._activeTlgr);
                this.adapter.destroy();
                this.adapter = null;
            }
        },

        _handleUserJoined: function (user, tlgr) {
            if (tlgr == this._oldTlgr) {
                this.fire("user_joined", "oldchannel: " + user, this);
            } else if (tlgr == this._activeTlgr) {
                this.fire("user_joined", user, this);
            }
        },

        _handleUserLeft: function (user, tlgr) {
            if (tlgr == this._oldTlgr) {
                this.fire("user_left", "oldchannel: " + user, this);
            } else if (tlgr == this._activeTlgr) {
                this.fire("user_left", user, this);
            }
        },

        _handleMessage: function (msg, tlgr) {
            if (tlgr == this._oldTlgr) {
                msg.sender = "oldchannel: "  + msg.sender;
                this.fire("message", msg , this);
            } else if (tlgr == this._activeTlgr) {
                this.fire("message", msg, this);
            }
        },

        _handleRekeyInfo: function (rekeyInfo) {
            console.log("Got rekey info", rekeyInfo);
            this._oldTlgr = this._activeTlgr;
            this._oldTlgr.sendChannelAbandoned();
            this._activeTlgr = this._factory.createTlgr();
            this._setTlgrEventHandlers(this._activeTlgr);
            this._activeTlgr.init({
                invite: rekeyInfo
            });
            this.fire("changed", this);
        },

        initiateRekey: function () {
            this._oldTlgr = this._activeTlgr;
            var users = this._oldTlgr.getUsers();
            var myAid = this._oldTlgr.getMyAid();
            var i = users.indexOf(myAid);
            if(i==-1) {
                this._oldTlgr = null;
                return;
            }
            users.splice(i, 1);
            this._activeTlgr = this._factory.createTlgr();
            this._setTlgrEventHandlers(this._activeTlgr);
            this._activeTlgr.init({} );
            this._oldTlgr.sendRekeyInfo(users, this._activeTlgr.generateInvitation());
            this._oldTlgr.sendChannelAbandoned();
        },

        destroy: function () {
            if (this.adapter) {
                this.adapter.off("packet", this._activeTlgr.onNetworkPacket, this._activeTlgr);
                //this.adapter.off("changed");
                this.adapter.destroy();
                this.adapter = null;
            }
            if (this._activeTlgr) {
                this._activeTlgr.sendChannelAbandoned();
                //this.tlgr.off("message");
                //this.tlgr.off("user_joined");
                //this.tlgr.off("user_left");
                //this.tlgr.off("openAddrIn");
                this._activeTlgr = null;
            }
            this.fire("changed", this);
        },

        _setTlgrEventHandlers: function (tlgr) {
            tlgr.on("packet", function (packet/*{addr, data}*/) {
                this._transport.sendPacket(packet);
            }.bind(this), this._activeTlgr);
            tlgr.on("openAddrIn", this._handleOpenAddrIn, this);
            tlgr.on("closeAddrIn", this._handleCloseAddrIn, this);
            tlgr.on("message", this._handleMessage, this);
            tlgr.on("user_left", this._handleUserLeft, this);
            tlgr.on("user_joined", this._handleUserJoined, this);
            tlgr.on("rekey", this._handleRekeyInfo, this);
            tlgr.on("changed", this._onChanged, this);
        },

        serialize: function (packet, context) {
            packet.setData({
                since: (this.adapter) ? (this.adapter._since) : 0
            });
            packet.setLink("activeTlgr", context.getPacket(this._activeTlgr));
            packet.setLink("transport", context.getPacket(this._transport));
        },

        deserialize: function (packet, context) {
            this.checkFactory();
            var factory = this._factory;
            this.since = packet.getData().since;
            this._activeTlgr = context.deserialize(packet.getLink("activeTlgr"), factory.createTlgr, factory);
            this._transport = context.deserialize(packet.getLink("transport"));
            this._setTlgrEventHandlers(this._activeTlgr);
            this._activeTlgr.afterDeserialize();
        },
    })
    module.exports = GrConnection;
});

