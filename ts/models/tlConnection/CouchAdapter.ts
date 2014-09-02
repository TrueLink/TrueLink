"use strict";
import invariant = require("modules/invariant");
import extend = require("tools/extend");
import CouchFetching = require("misc/CouchFetching");
import Event = require("tools/event");
import eventEmitter = require("modules/events/eventEmitter");
import Hex = require("modules/multivalue/hex");
import Multivalue = require("modules/multivalue/multivalue");
import urandom = require("modules/urandom/urandom");
import tools = require("modules/tools");

export class CouchAdapter {
    public onPacket: Event.Event<ICouchPacket>;
    public onChanged: Event.Event<any>;
    public transport: any;
    public _since: number;

    private _packetCache: Array<any>;
    private _context: number;
    private _addr: any;
    private processedPackets : { [key:string]: any };

    constructor(transport, options) {
        this.onPacket = new Event.Event<ICouchPacket>();
        this.onChanged = new Event.Event<any>();
        invariant(transport, "Can i haz transport?");
        invariant(options, "Can i haz options?");
        invariant(options.addr instanceof Multivalue, "options.addr must be multivalue");
        invariant(options.context, "Can i haz options.context?");

        this.processedPackets = { };
        this.transport = transport;
        this.transport.onPackets.on(this._processPackets, this);
        this._packetCache = [];
        this._context = options.context;
        this._addr = options.addr;
    }

    init() {
        this.transport.beginPolling(this._addr, this._context);
        //TODO: this is hacky
        setTimeout( this._requestFetch(), 250);
    }

    run() { this.init(); }

    on(eName: string, handler: any, context: any) {
        if (eName === "changed") {
            this.onChanged.on(handler, context);
        } else if (eName === "packet") {
            this.onPacket.on(handler, context);
        }
    }
    fire(eName: string, args: any) {
        if (eName === "changed") {
            this.onChanged.emit(args);
        } else {
            console.log("fire called on couchadapter");
        }
    }

    _requestFetch() {
        this.transport.fetchChannel(this._addr, 0, this._context);
    }

    private _processPackets (packets: ICouchPackets) {
        packets.packets.forEach((p: ICouchPacket) => {
            var changes = false;
            if(!this.processedPackets[p.id]) {
                this.onPacket.emit(p);
                this.processedPackets[p.id] = true;
                changes = true;
            }
            if(changes) {
                this.onChanged.emit(this);
            }
        }, this);
    }

    private handleFetchResult (packets: ICouchPackets) {
        console.log("Fetching done for channel: ", this._addr, packets);
        this._processPackets(packets);
    }

    serialize() {
        return {
            context: this._context,
            addr: this._addr.as(Hex).serialize(),
            since: this._since
        };
    }
    destroy() {
        this.transport.endPolling(this._addr, this._context);
        this.transport.onPackets.off(this._processPackets, this);
    }
};
export var deserialize = function(transport, data) {
    var deserData = extend({}, data);
    deserData.addr = Hex.deserialize(data.addr);
    return new CouchAdapter(transport, deserData);
};


