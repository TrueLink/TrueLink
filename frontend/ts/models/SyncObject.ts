import Model = require("../tools/model");
import CouchTransport = require("../models/tlConnection/CouchTransport");

import TlConnection = require("../models/tlConnection/TlConnection");
import GrConnection = require("../models/grConnection/GrConnection");

export class SyncObject extends Model.Model implements ISerializable {
    public grConnection: GrConnection.GrConnection;
    public tlConnections: TlConnection.TlConnection[];
    public transport : CouchTransport.CouchTransport;
    public initialConnection: TlConnection.TlConnection;
    public deviceName: string;
    public master: boolean;

    constructor () {
        super();
        this.grConnection = null;
        this.tlConnections = [];
        this.transport = null;
        this.initialConnection = null;
        this.deviceName = navigator.userAgent;
        this.master = undefined;
    }

    init (args) {
        this.transport = args.transport;
        this.master = args.master;
        this.grConnection = this.getFactory().createGrConnection();
        if(this.master) {
            this.grConnection.init({
                invite: null,
                userName: this.deviceName,
                transport: this.transport
            });
        } else {
            this.initialConnection = this._createTlConnection();
        }
    }

    private _createTlConnection  () {
        this.checkFactory();
        var tlConnection = this.getFactory().createTlConnection();
        tlConnection.init();
        return tlConnection;
    }

    private _addTlConnection  (conn) {
        this._linkTlConnection(conn);
        this.tlConnections.push(conn);
    }

    private _linkTlConnection  (conn) {
        conn.onMessage.on(this._onTlConnectionMessage, this);
    }

    private _onTlConnectionMessage  (message, tlConnection) {
    }

    serialize  (packet, context) {
        packet.setData({
            deviceName: this.deviceName,
            master: this.master
        });
        packet.setLink("tlConnections", context.getPacket(this.tlConnections));
        packet.setLink("grConnection", context.getPacket(this.grConnection));
        packet.setLink("initialConnection", context.getPacket(this.initialConnection));
        packet.setLink("transport", context.getPacket(this.transport));
    }

    deserialize  (packet, context) {
        this.checkFactory();
        var factory = this.getFactory();
        var data = packet.getData();
        this.deviceName = data.deviceName;
        this.master = data.master;
        this.tlConnections = context.deserialize(packet.getLink("tlConnections"), factory.createTlConnection, factory);
        this.grConnection = context.deserialize(packet.getLink("grConnection"), factory.createGrConnection, factory);
        this.initialConnection = context.deserialize(packet.getLink("initialConnection"), factory.createTlConnection, factory);
        this.transport = context.deserialize(packet.getLink("transport"));
    }
}