    "use strict";
    import modules = require("modules");
    import invariant = require("invariant");
    import extend = require("../../tools/extend");
    var eventEmitter = modules.events.eventEmitter;
    var serializable = modules.serialization.serializable;
    import model = require("../../mixins/model");
    import Event = require("../../tools/event");
    import Model = require("../../tools/model");
    import Tlec = require("Tlec");
    var TlecBuilder = Tlec.Builder;
    import CouchAdapter = require("../../models/tlConnection/CouchAdapter");
    import CouchTransport = require("../../models/tlConnection/CouchTransport");

    import MultivalueModule = require("Multivalue");
    var Hex = MultivalueModule.Hex;


    import uuid = require("uuid");

    export class GrConnection extends Model.Model implements ISerializable {
        public onUserJoined : Event.Event<ITlgrShortUserInfo>;
        public onUserLeft : Event.Event<ITlgrShortUserInfo>;
        public onMessage : Event.Event<ITlgrTextMessageWrapper>;
        public onEcho : Event.Event<ITlgrTextMessageWrapper>;
        public onMessageOrEcho : Event.Event<ITlgrTextMessageWrapper>;
        public onSyncMessage : Event.Event<any>;
        public onReadyForSync : Event.Event<any>;
        
        public id: string;

        public _activeTlgr : ITlgr;
        private _oldTlgr : ITlgr;
        private _transport : CouchTransport.CouchTransport;
        private since : number;
        private adapter : CouchAdapter.CouchAdapter;
        private _undeliveredHashtails: any[]; // sync messages, can be serialized directly
        private _readyForSyncFired: boolean; // prevents firing ready for sync on rekey
        private _profileId: string; // for tlgr init on rekeys

        constructor () {
            super();
            this.onUserJoined = new Event.Event<ITlgrShortUserInfo>("GrConnection.onUserJoined");
            this.onUserLeft = new Event.Event<ITlgrShortUserInfo>("GrConnection.onUserLeft");
            this.onMessage = new Event.Event<ITlgrTextMessageWrapper>("GrConnection.onMessage");
            this.onEcho = new Event.Event<ITlgrTextMessageWrapper>("GrConnection.onEcho");
            this.onMessageOrEcho = new Event.Event<ITlgrTextMessageWrapper>("GrConnection.onMessageOrEcho");
            this.onReadyForSync = new Event.Event<any>("GrConnection.onReadyForSync");
            this.onSyncMessage = new Event.Event<any>("GrConnection.onSyncMessage");
            
            this._activeTlgr = null;
            this._transport = null;

            this._undeliveredHashtails = null;
        }

    //interface IGrConnectionInitParams {
    //
    //}
        //called when creating totally new connection (not when deserialized)
        init  (args, syncArgs?) {
            this.id = (syncArgs && syncArgs.id) || uuid();

            this.since = 0;
            this._transport = args.transport;
            this._undeliveredHashtails = [];
            this._activeTlgr = this.getFactory().createTlgr();
            this._readyForSyncFired = !!syncArgs;
            this._profileId = args.profileId;
            
            this._setTlgrEventHandlers(this._activeTlgr);

            this._activeTlgr.init({
                profileId: this._profileId,
                invite: args.invite,
                userName: args.userName
            }, syncArgs && syncArgs.args);
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

        private _handleEcho  (msg: ITlgrTextMessageWrapper, tlgr : ITlgr) {
            if (tlgr == this._oldTlgr) {
                msg.sender.oldchannel = true;
            }
            this.onEcho.emit(msg , this);
        }

        private _handleMessageOrEcho  (msg: ITlgrTextMessageWrapper, tlgr : ITlgr) {
            if (tlgr == this._oldTlgr) {
                msg.sender.oldchannel = true;
            }
            this.onMessageOrEcho.emit(msg , this);
        }



        private _handleRekeyInfo  (rekeyInfo, tlgr: ITlgr) {
            console.log("Got rekey info", rekeyInfo);
            if (tlgr == this._oldTlgr) {
                // ignore rekeys from oldTlgr
                // this also prevents re-rekey of rekey done in this.initiateRekey
                return;
            }

            this._oldTlgr = this._activeTlgr;
            if (!rekeyInfo.doNotSendGjp) {
                this._oldTlgr.sendChannelAbandoned();
            }
            this._activeTlgr = this.getFactory().createTlgr();
            this._setTlgrEventHandlers(this._activeTlgr);
            this._activeTlgr.init({
                profileId: this._profileId,
                doNotSendGjp: rekeyInfo.doNotSendGjp,
                invite: rekeyInfo.rekeyInfo,
                userName: this._oldTlgr.getMyName(),
                keyPair: this._oldTlgr.getKeyPair()
            });
            this._undeliveredHashtails = this._undeliveredHashtails
                .filter(ht => !this._processHashtailDelegationBoby(ht));
            this.onChanged.emit(this);
        }

        getMyName  () {
            return this._activeTlgr.getMyName();
        }

        initiateRekey  (members : Array<ITlgrShortUserInfo>/*not sure about this interface*/) {
            var myAid = this._activeTlgr.getMyAid();
            if (!members.some((m: ITlgrShortUserInfo) => m.aid === myAid))
            {
                // prevent rekey that excludes rekey initiator
                return;
            }

            this._oldTlgr = this._activeTlgr;
            this._activeTlgr = this.getFactory().createTlgr();
            this._setTlgrEventHandlers(this._activeTlgr);
            this._activeTlgr.init({
                profileId: this._profileId,
                userName: this._oldTlgr.getMyName(),
                keyPair: this._oldTlgr.getKeyPair()
            } );
            this._oldTlgr.sendRekeyInfo(
                members.map(function (m) { return m.aid; }),
                this._activeTlgr.generateInvitation());
            this._oldTlgr.sendChannelAbandoned();
            this._undeliveredHashtails = this._undeliveredHashtails
                .filter(ht => !this._processHashtailDelegationBoby(ht));
            this.onChanged.emit(this);
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
            tlgr.on("echo", this._handleEcho, this);
            tlgr.on("messageOrEcho", this._handleMessageOrEcho, this);
            tlgr.on("user_left", this._handleUserLeft, this);
            tlgr.on("user_joined", this._handleUserJoined, this);
            tlgr.on("rekey", this._handleRekeyInfo, this);
            tlgr.on("changed", this._onChanged, this);
            tlgr.on("readyForSync", this._onReadyForSync, this);
        }

        private _onReadyForSync (syncArgs) {
            if (this._readyForSyncFired) { return; }
            this._readyForSyncFired = true;
            this.onReadyForSync.emit({
                id: this.id,
                args: syncArgs
            });
        }

        private _sendSyncMessage(what, args) {
            this.onSyncMessage.emit({
                id: this.id,
                what: what,
                args: args
            });
        }

        private _processHashtailDelegationBoby(args) {
            return this._activeTlgr.processDelegatedHashtail({
                groupUid: Hex.deserialize(args.groupUid),
                hashtail: {
                    owner: args.hashtail.owner,
                    start: Hex.deserialize(args.hashtail.start),
                    counter: args.hashtail.counter
                }
            });
        }

        private _processHashtailDelegation(args) {
            var gotIt = this._processHashtailDelegationBoby(args);
            if (!gotIt) {
                this._undeliveredHashtails.push(args);
            }
        }

        processSyncMessage(args) {
            if (args.id !== this.id) { return; }

            if (args.what === "hashtail") {
                this._processHashtailDelegation(args.args);
            }
            this.onChanged.emit(this);
        }

        addCowriter(cowriter) {
            var hashtail = this._activeTlgr.delegateHashtail(cowriter);
            if (!hashtail) { return; }

            this._sendSyncMessage("hashtail", {
                groupUid: hashtail.groupUid.as(Hex).serialize(),
                hashtail: {
                    owner: hashtail.hashtail.owner,
                    start: hashtail.hashtail.start.as(Hex).serialize(),
                    counter: hashtail.hashtail.counter
                }
            });
        }

        serialize  (packet, context) {
            packet.setData({
                profileId: this._profileId,
                since: (this.adapter) ? (this.adapter._since) : 0,
                theId: this.id,
                undeliveredHashtails: this._undeliveredHashtails,
                readyForSyncFired: this._readyForSyncFired
            });
            packet.setLink("activeTlgr", context.getPacket(this._activeTlgr));
            packet.setLink("transport", context.getPacket(this._transport));
        }

        deserialize  (packet, context) {
            invariant(this.getFactory(), "factory is not set");
            var factory = this.getFactory();
            var data = packet.getData();

            this._profileId = data.profileId;
            this.since = data.since;
            this.id = data.theId;
            this._undeliveredHashtails = data.undeliveredHashtails;
            this._readyForSyncFired = data.readyForSyncFired;
            this._activeTlgr = context.deserialize(packet.getLink("activeTlgr"), factory.createTlgr, factory);
            this._transport = context.deserialize(packet.getLink("transport"));
            this._setTlgrEventHandlers(this._activeTlgr);
            this._activeTlgr.afterDeserialize();
        }
    }
extend(GrConnection.prototype, serializable);
