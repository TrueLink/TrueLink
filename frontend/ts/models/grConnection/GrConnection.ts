    "use strict";
    import modules = require("modules");
    var invariant = modules.invariant;
    import extend = require("../../tools/extend");
    var eventEmitter = modules.events.eventEmitter;
    var serializable = modules.serialization.serializable;
    import model = require("../../mixins/model");
    var Hex = modules.multivalue.hex;
    import Event = require("../../tools/event");
    import Model = require("../../tools/model");
    import TlecBuilder = require("TlecBuilder");
    import CouchAdapter = require("../../models/tlConnection/CouchAdapter");
    import CouchTransport = require("../../models/tlConnection/CouchTransport");

    export class GrConnection extends Model.Model implements ISerializable {
        public onUserJoined : Event.Event<ITlgrShortUserInfo>;
        public onUserLeft : Event.Event<ITlgrShortUserInfo>;
        public onMessage : Event.Event<ITlgrTextMessageWrapper>;

        public _activeTlgr : ITlgr;
        private _oldTlgr : ITlgr;
        private _transport : CouchTransport.CouchTransport;
        private since : number;
        private adapter : CouchAdapter.CouchAdapter;

        constructor () {
            super();
            this.onUserJoined = new Event.Event<ITlgrShortUserInfo>("GrConnection.onUserJoined");
            this.onUserLeft = new Event.Event<ITlgrShortUserInfo>("GrConnection.onUserLeft");
            this.onMessage = new Event.Event<any>("GrConnection.onMessage");

            this._activeTlgr = null;
            this._transport = null;
        }

    //interface IGrConnectionInitParams {
    //
    //}
        //called when creating totally new connection (not when deserialized)
        init  (args) {
            this.since = 0;
            this._transport = args.transport;
            this._activeTlgr = this.getFactory().createTlgr();
            
            this._setTlgrEventHandlers(this._activeTlgr);

            this._activeTlgr.init({
                invite: args.invite,
                userName: args.userName
            });
            this.onChanged.emit(this);
        }

        getMyAid  () {
            return this._activeTlgr.getMyAid();
        }

        sendMessage  (message : string) {
            this._activeTlgr.sendMessage(message);
        }

        private _handleOpenAddrIn  (args) {
            console.log("Tlgr openAddrIn");
            var _couchAdapter = new CouchAdapter.CouchAdapter(this._transport, {
                context: args.context,
                addr: args.addr,
                since: this.since
            });
            this.adapter = _couchAdapter;
            _couchAdapter.onPacket.on(this._activeTlgr.onNetworkPacket, this._activeTlgr);
            _couchAdapter.onChanged.on(this._onChanged, this);
            _couchAdapter.init(args.fetch ? {} : { fetchIfZeroSince: true });
        }

        private _handleCloseAddrIn  (args) {
            if (this.adapter) {
                this.adapter.onPacket.off(this._activeTlgr.onNetworkPacket, this._activeTlgr);
                this.adapter.destroy();
                this.adapter = null;
            }
        }

        private _handleUserJoined  (user : ITlgrShortUserInfo, tlgr : ITlgr) {
            if (tlgr == this._oldTlgr) {
                user.oldchannel = true;
            }
            this.onUserJoined.emit(user, this);
        }

        private _handleUserLeft  (user, tlgr : ITlgr) {
            if (tlgr == this._oldTlgr) {
                user.oldchannel = true;
            }
            this.onUserLeft.emit(user, this);
        }

        private _handleMessage  (msg: ITlgrTextMessageWrapper, tlgr : ITlgr) {
            if (tlgr == this._oldTlgr) {
                msg.sender.oldchannel = true;
            }
            this.onMessage.emit(msg , this);
        }

        private _handleRekeyInfo  (rekeyInfo) {
            console.log("Got rekey info", rekeyInfo);
            this._oldTlgr = this._activeTlgr;
            var myName = this._activeTlgr.getMyName();
            this._oldTlgr.sendChannelAbandoned();
            this._activeTlgr = this.getFactory().createTlgr();
            this._setTlgrEventHandlers(this._activeTlgr);
            this._activeTlgr.init({
                invite: rekeyInfo,
                userName: myName
            });
            this.onChanged.emit(this);
        }

        getMyName  () {
            return this._activeTlgr.getMyName();
        }

        initiateRekey  (members : Array<ITlgrShortUserInfo>/*not sure about this interface*/) {
            this._oldTlgr = this._activeTlgr;
            var myAid = this._oldTlgr.getMyAid();
            var i = -1;
            members.forEach(function (m : ITlgrShortUserInfo, ind) {
                if (m.aid === myAid) {
                    i = ind;
                }
            });
            if(i==-1) {
                this._oldTlgr = null;
                return;
            }
            var myName = members[i].name;
            members.splice(i, 1);
            this._activeTlgr = this.getFactory().createTlgr();
            this._setTlgrEventHandlers(this._activeTlgr);
            this._activeTlgr.init({
                userName: myName 
            } );
            this._oldTlgr.sendRekeyInfo(members.map(function (m) { return m.aid; }), this._activeTlgr.generateInvitation());
            this._oldTlgr.sendChannelAbandoned();
        }

        destroy  () {
            if (this.adapter) {
                this.adapter.onPacket.off(this._activeTlgr.onNetworkPacket, this._activeTlgr);
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
            this.onChanged.emit(this);
        }

        private _setTlgrEventHandlers  (tlgr : ITlgr) {
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
        }

        serialize  (packet, context) {
            packet.setData({
                since: (this.adapter) ? (this.adapter._since) : 0
            });
            packet.setLink("activeTlgr", context.getPacket(this._activeTlgr));
            packet.setLink("transport", context.getPacket(this._transport));
        }

        deserialize  (packet, context) {
            invariant(this.getFactory(), "factory is not set");
            var factory = this.getFactory();
            this.since = packet.getData().since;
            this._activeTlgr = context.deserialize(packet.getLink("activeTlgr"), factory.createTlgr, factory);
            this._transport = context.deserialize(packet.getLink("transport"));
            this._setTlgrEventHandlers(this._activeTlgr);
            this._activeTlgr.afterDeserialize();
        }
    }
extend(GrConnection.prototype, serializable);
