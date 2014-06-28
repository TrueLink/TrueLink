define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var Hex = require("modules/multivalue/hex");
    var Multivalue = require("modules/multivalue/multivalue");
    var urandom = require("modules/urandom/urandom");
    var tools = require("modules/tools");


    function CouchAdapter(transport, options) {
        this._defineEvent("packet");
        invariant(transport, "Can i haz transport?");
        invariant(options, "Can i haz options?");
        invariant(options.addr instanceof Multivalue, "options.addr must be multivalue");
        invariant(options.context, "Can i haz options.context?");
        invariant(options.since, "Can i haz options.since?");

        this.transport = options.transport;
        this.transport.on("packets", this._processPackets, this);
        this._packetCache = [];
        this._context = options.context;
        this._addr = options.addr;
        this._since = options.since || 0;
        this._fetchingRequested = false;
        this._fetchingContext = null;
    }


    function searchSeq(p) {
        for (var i = 0; i < this.length; i++) {
            if(this[i].seq === p.seq) { return i;}
        }
        return -1;
    }

    function sortSeq(a, b) {
        return a.seq - b.seq;
    }

    extend(CouchAdapter.prototype, eventEmitter, {

        init: function () {
            this.transport.beginPolling(this._addr, this._context);
        },
        run: function () { this.init(); },

        _requestFetch: function () {
            if (this._fetchingRequested) { return; }
            this._fetchingContext = urandom.int(0, 0xFFFFFFFF);
            this.transport.fetchChannel(this._addr, this._fetchingContext, 0);
            this._fetchingRequested = true;
        },

        _mergeWithStored: function (packets) {
            var newArr = this._packetCache.concat(packets);
            this._packetCache = tools.arrayUnique(newArr, searchSeq);
        },
        _processPackets: function (args) {
            this._mergeWithStored(args.packets);
            if (args.since <= this._since) {
                this.since = args.lastSeq;
                this._onPackets();
            } else {
                this._requestFetch();
            }
            if (args.context === this._fetchingContext) {
                this.since = args.lastSeq;
                this._fetchingRequested = false;
            }
        },
        _onPackets: function () {
            var packets = this._packetCache.sort(sortSeq);
            packets.forEach(function (p) { this.fire("packet", p); });
            this._packetCache = [];
        },

        serialize: function () {
            return {
                context: this._context,
                addr: this._addr.as(Hex).serialize(),
                since: this._since
            };
        },
        destroy: function () {
            this.transport.endPolling(this._addr, this._context);
            this.transport.off("packets", this._processPackets, this);
        }
    });
    CouchAdapter.deserialize = function (transport, data) {
        data.addr = Hex.deserialize(data.addr);
        return new CouchAdapter(transport, data);
    };
    module.exports = CouchAdapter;
});