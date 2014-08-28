"use strict";
import invariant = require("modules/invariant");
import extend = require("tools/extend");
import Event = require("tools/event");
import eventEmitter = require("modules/events/eventEmitter");
import Hex = require("modules/multivalue/hex");
import Multivalue = require("modules/multivalue/multivalue");
import urandom = require("modules/urandom/urandom");
import tools = require("modules/tools");

export interface ICouchPacket {
}

    export var CouchAdapter = function(transport, options) {
    this.onPacket = new Event.Event<ICouchPacket>();
    this.onChanged = new Event.Event<any>();
    invariant(transport, "Can i haz transport?");
    invariant(options, "Can i haz options?");
    invariant(options.addr instanceof Multivalue, "options.addr must be multivalue");
    invariant(options.context, "Can i haz options.context?");

    this.transport = transport;
    this.transport.on("packets", this._processPackets, this);
    this._packetCache = [];
    this._sinceCache = 0;
    this._context = options.context;
    this._addr = options.addr;
    this._since = options.since || 0;
    this._fetchingRequested = false;
    this._fetchingContext = null;
}


    function searchSeq(p) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].seq === p.seq) { return i; }
    }
    return -1;
}

function sortSeq(a, b) {
    return a.seq - b.seq;
}

extend(CouchAdapter.prototype, {

    init: function() {
        this.transport.beginPolling(this._addr, this._context);
        this._requestFetch();
    },
    run: function() { this.init(); },

    on: function(eName: string, handler: any, context: any) {
        if (eName === "changed") {
            this.onChanged.on(handler, context);
        } else if (eName === "packet") {
            this.onPacket.on(handler, context);
        }
    },
    fire: function(eName: string, args: any) {
        if (eName === "changed") {
            this.onChanged.emit(args);
        } else {
            console.log("fire called on couchadapter");
        }
    },

    _requestFetch: function() {
        if (this._fetchingRequested) { return; }
        this._fetchingContext = urandom.int(0, 0xFFFFFFFF);
        this._fetchingRequested = true;
        this.transport.fetchChannel(this._addr, this._since, this._fetchingContext);
    },

    _mergeWithStored: function(packets, lastSeq) {
        if (lastSeq > this._sinceCache) {
            this._sinceCache = lastSeq;
        }
        var newArr = this._packetCache.concat(packets);
        this._packetCache = tools.arrayUnique(newArr, searchSeq);
    },

    _processPackets: function(args) {
        this._mergeWithStored(args.packets, args.lastSeq);
        if (args.since <= this._since) {
            this._since = this._sinceCache;
            this.onChanged.emit(this);
            this._onPackets();
        } else {
            this._requestFetch();
        }
        if (args.context === this._fetchingContext) {
            this._fetchingRequested = false;
        }
    },
    _onPackets: function() {
        var packets = this._packetCache.sort(sortSeq);
        packets.forEach(function(p) { this.onPacket.emit(p); }, this);
        this._packetCache = [];
    },

    serialize: function() {
        return {
            context: this._context,
            addr: this._addr.as(Hex).serialize(),
            since: this._since
        };
    },
    destroy: function() {
        this.transport.endPolling(this._addr, this._context);
        this.transport.off("packets", this._processPackets, this);
    }
});
export var deserialize = function(transport, data) {
    var deserData = extend({}, data);
    deserData.addr = Hex.deserialize(data.addr);
    return new CouchAdapter(transport, deserData);
};

