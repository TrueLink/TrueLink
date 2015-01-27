"use strict";
import modules = require("modules");
import invariant = require("invariant");
import extend = require("../../tools/extend");
import CouchFetching = require("../../misc/CouchFetching");
import Event = require("../../tools/event");
var eventEmitter = modules.events.eventEmitter;
import Hex = require("Multivalue/multivalue/hex");
import MultivalueModule = require("Multivalue");
var Multivalue = MultivalueModule.multivalue.Multivalue;
var urandom = modules.urandom.urandom;
var tools = modules.tools;
import $=require("zepto");

export interface IAdapterRunOptions {
    dontFetch?: boolean;
    fetchIfZeroSince?: boolean;
}

export class CouchAdapter {
    public onPacket: Event.Event<ICouchMultivaluePacket>;
    public onChanged: Event.Event<any>;
    public transport: any;
    public _since: number;

    private _packetCache: Array<any>;
    private _context: number;
    private _addr: any;
    private processedPackets : { [key:string]: any };
    private _needFetch: boolean;

    constructor(transport, options) {
        this.onPacket = new Event.Event<ICouchMultivaluePacket>("CouchAdapter.onPacket");
        this.onChanged = new Event.Event<any>("CouchAdapter.onChanged");
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
        this._since = options.since ? options.since : 0;
        this._needFetch = false;
    }

    init(opts : IAdapterRunOptions) {
        this.transport.beginPolling(this._addr, this._context);
        var url = this.transport._postingUrl;
        if(!opts.dontFetch) {
            console.log("NOP url", url, "addr", this._addr);        
            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json",
                context: this,
                data: JSON.stringify({_id: ("nop_" + Math.random()), ChannelId: this._addr.value, DataString: "AAAA" }),
                success: function(data, status, xhr) { 
                    console.log("NOP success");
                },
                error: function(xhr, errorType, error) {
                    console.log("NOP error");
                }
            });
            if(opts.fetchIfZeroSince && this._since == 0) {
                this._needFetch = true;        
            } else {
                if(!opts.fetchIfZeroSince) {
                    this._needFetch = true;        
                }
            }
        }
    }

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

    private _processPackets (packets: ICouchMultivaluePackets) {
        //if packets came from poll we should know the since
        if(packets.lastSeq) {
            this._since = packets.lastSeq;
        }
        if(this._needFetch) {
            console.log("needfetch")
            this._requestFetch();
            this._needFetch = false;
        }else{
            console.log("no needfetch")
        }
        packets.packets.forEach((p: ICouchMultivaluePacket) => {
            if (!this._addr.as(Hex).isEqualTo((<MultivalueModule.multivalue.Multivalue>p.addr).as(Hex))) {
                return; 
            }
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

    private handleFetchResult (packets: ICouchMultivaluePackets) {
        debugger; // mr: where is this called? cannot find by fulltext search 
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


