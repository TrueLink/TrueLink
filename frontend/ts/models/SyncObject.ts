import modules = require("modules");
var serializable = modules.serialization.serializable;
import extend = require("../tools/extend");
import Event = require("../tools/event");

import Model = require("../tools/model");
import CouchTransport = require("../models/tlConnection/CouchTransport");
import TlConnection = require("../models/tlConnection/TlConnection");
import GrConnection = require("../models/grConnection/GrConnection");

export class SyncObject extends Model.Model implements ISerializable {
    public onJoinedToSync: Event.Event<SyncObject>;
    public onSyncMessage: Event.Event<ITlgrTextMessageWrapper>;

    public grConnection: GrConnection.GrConnection;
    public tlConnections: TlConnection.TlConnection[];
    public transport: CouchTransport.CouchTransport;
    public initialConnection: TlConnection.TlConnection;
    public deviceName: string;
    public master: boolean;
    public devices: ITlgrShortUserInfo[];
    public profileUuid: string;

    constructor () {
        super();
        this.onJoinedToSync = new Event.Event<SyncObject>("SyncObject.onJoinedToSync");
        this.onSyncMessage = new Event.Event<ITlgrTextMessageWrapper>("SyncObject.onSyncMessage");
        this.grConnection = null;
        this.tlConnections = [];
        this.transport = null;
        this.initialConnection = null;
        this.deviceName = navigator.userAgent;
        this.master = undefined;
        this.devices = [];
        this.profileUuid = null;
    }

    init (args) {
        this.transport = args.transport;
        this.master = args.master;
        this.profileUuid = args.profileUuid;
        this.grConnection = this.getFactory().createGrConnection();
        this._linkGrConnection(this.grConnection);
        if(this.master) {
            this.grConnection.init({
                invite: null,
                userName: this.profileUuid,
                transport: this.transport
            });
        } else {
            this.initialConnection = this.getFactory().createTlConnection();
            this.initialConnection.init();
            this._linkConnectionToMaster(this.initialConnection);
        }
        this._onChanged();
    }

    public startSlaveConnection() {
        var conn = this.getFactory().createTlConnection();
        conn.init();

        this.tlConnections.push(conn);
        this._linkConnectionToSlave(conn);
        conn.generateOffer();

        this._onChanged();
    }

    private _linkConnectionToMaster(conn) {
        conn.onMessage.on(this._onMessageFromMasterReceived, this);
        conn.run();
    }

    private _linkGrConnection(conn) {
        conn.onUserJoined.on(this._deviceAdded, this);
        conn.onUserLeft.on(this._deviceRemoved, this);
        conn.onMessage.on(this._onSyncMessage, this);
    }

    private _onSlaveConnected(conn) {
        var invitation = this.grConnection._activeTlgr.generateInvitation(); 
        // `grConnection._activeTlgr` Incapsulation violation!!!! Should be `grConnection.generateInvitation()`
        var message = { 
            type: "tlgr-invite",
            invite: invitation,
        };
        conn.sendMessage(message);
    }

    private _linkConnectionToSlave(conn) {
        conn.onDone.on(this._onSlaveConnected, this);
    }

    private _deviceAdded(device: ITlgrShortUserInfo) {
        this.devices.push(device)
        this._onChanged();
    }

    private _deviceRemoved(device: ITlgrShortUserInfo) {
        // TBD
    }
    
    private _onSyncMessage(message: ITlgrTextMessageWrapper) {
        this.onSyncMessage.emit(message);
    }

    sendSyncMessage(message: any) {
        this.grConnection.sendMessage(JSON.stringify(message));
    }

    private _onMessageFromMasterReceived(message, tlConnection) {
        if(message.type == "tlgr-invite") {
            this.grConnection.init({
                invite: message.invite,
                userName: this.profileUuid,
                transport: this.transport
            });
            this.onJoinedToSync.emit(this);   
        }
    }

    serialize(packet, context) {
        packet.setData({
            deviceName: this.deviceName,
            profileUuid: this.profileUuid,
            master: this.master,
            devices: this.devices,
        });
        packet.setLink("tlConnections", context.getPacket(this.tlConnections));
        packet.setLink("grConnection", context.getPacket(this.grConnection));
        packet.setLink("initialConnection", context.getPacket(this.initialConnection));
        packet.setLink("transport", context.getPacket(this.transport));
    }

    deserialize(packet, context) {
        this.checkFactory();
        var factory = this.getFactory();
        var data = packet.getData();
        this.deviceName = data.deviceName;
        this.profileUuid = data.profileUuid;
        this.master = data.master;
        this.devices = data.devices;
        this.transport = context.deserialize(packet.getLink("transport"));
        this.tlConnections = context.deserialize(packet.getLink("tlConnections"), factory.createTlConnection, factory);
        this.grConnection = context.deserialize(packet.getLink("grConnection"), factory.createGrConnection, factory);
        this._linkGrConnection(this.grConnection);
        this.initialConnection = context.deserialize(packet.getLink("initialConnection"), factory.createTlConnection, factory);
        if(this.initialConnection) {
            this._linkConnectionToMaster(this.initialConnection);
        }
    }
}

extend(SyncObject.prototype, serializable);
