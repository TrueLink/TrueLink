    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import eventEmitter = require("modules/events/eventEmitter");
    import serializable = require("modules/serialization/serializable");
    import model = require("mixins/model");
    import Event = require("tools/event");
    import Dictionary = require("modules/dictionary/dictionary");
    import Multivalue = require("modules/multivalue/multivalue");
    import Hex = require("modules/multivalue/hex");
    import CouchPolling = require("misc/CouchPolling");
    import CouchPosting = require("misc/CouchPosting");
    import CouchFetching = require("misc/CouchFetching");


    function CouchTransport() {

        this.onChanged = new Event.Event<any>();
        this.onPackets = new Event.Event<ICouchMultivaluePackets>();

        this._pollingUrl = null;
        this._polling = null;
        this._postingUrl = null;
        this._posting = null;

        // url => since
        this._sinces = {};
        // fetching => context
        this._fetchings = new Dictionary();
        // [{channelName: "", data: ""}]
        this._unsentPackets = [];
        // context => addr
        this._channels = {};
    }

    extend(CouchTransport.prototype, eventEmitter, serializable, model, {
        init: function (args) {
            invariant(args.pollingUrl, "Can i haz args.pollingUrl?");
            invariant(args.postingUrl, "Can i haz args.postingUrl?");
            this._setPollingUrl(args.pollingUrl);
            this._setPostingUrl(args.postingUrl);
            this._onChanged();
        },

        // context will not appear in the request results for now
        // if a context will be needed in the results - rewrite _onPackets() to emit "packets" event this._channels.length times (for each context)
        beginPolling: function (channel, context) {
            if (this._channels[context]) {
                throw new Error("Context already exists");
            }
            this._channels[context] = channel;
            this._pollChannels();
        },

        endPolling: function (channel, context) {
            delete this._channels[context];
            this._pollChannels();
        },

        on: function(eName, handler, context) {
            if (eName === "packets") {
                this.onPackets.on(handler, context);
            } else if (eName === "changed") {
                this.onChanged.on(handler, context);
            } else {
                console.log("unknown event in CouchTransport");
            }
        },

        fire: function (eName: string, args, sender) {
            if (eName === "changed") {
                this.onChanged.emit(args, sender);
            } else if (eName === "packets") {
                this.onPackets.emit(args, sender);
            } else {
                console.log("unknown event fired on CouchTransport");
            }
        },

        _pollChannels: function () {
            invariant(this._polling, "polling url was not set");
            var dict = this._channels;
            var channels = Object.keys(dict).map(function (key) { return dict[key]; });
            this._polling.beginPolling(channels.map(function (ch) { return ch.as(Hex).toString(); }));
        },

        fetchChannel: function (channel, since, context) {
            
            var fetching = new CouchFetching.CouchFetching(this._pollingUrl, context);
            fetching.onPackets.on(this._onPackets, this);
            fetching.beginRequest(channel.as(Hex).toString(), since);
        },

        sendPacket: function (args) {
            invariant(args.addr instanceof Multivalue, "args.addr must be multivalue");
            invariant(args.data instanceof Multivalue, "args.data must be multivalue");
            invariant(this._postingUrl, "postingUrl is not set");

            var addr = args.addr;
            var packet = args.data;

            if ((packet.as(Hex).toString().length * 4) % 128) {
                debugger;
            }
            this._unsentPackets.push({
                channelName: addr.as(Hex).toString(),
                data:  packet.as(Hex).toString()
            });

            this._onChanged();

            if (this._unsentPackets.length === 1) {
                this._sendNextPacket();
            }
        },

        serialize: function (packet, context) {
            packet.setData({
                sinces: this._sinces,
                unsent: this._unsentPackets,
                pollingUrl: this._pollingUrl,
                postingUrl: this._postingUrl
            });
        },
        deserialize: function (packet, context) {
            var data = packet.getData();
            this._sinces = data.sinces;
            this._unsentPackets = data.unsent;
            this._setPollingUrl(data.pollingUrl);
            this._setPostingUrl(data.postingUrl);
        },

        _setPollingUrl: function (newUrl) {
            if (this._pollingUrl) {
                // store addrs from running polling and getting
                // this._polling.off(...)
                throw new Error("Not implemented");
            }
            this._pollingUrl = newUrl;
            if (!this._sinces[newUrl]) {
                this._sinces[newUrl] = 0;
            }
            this._polling = new CouchPolling.CouchPolling(newUrl, this._sinces[newUrl]);
            //Event subscription
            this._polling.onPackets.on(this._onPollingPackets, this);
            this._onChanged();
        },

        _setPostingUrl: function (newUrl) {
            if (this._postingUrl) {
                // store packets to resend (?)
                // this._posting.off(...)
                throw new Error("Not implemented");
            }
            this._postingUrl = newUrl;
            this._posting = new CouchPosting(newUrl);
            this._posting.on("success", this._onPostingSuccess, this);
            this._posting.on("error", this._onPostingError, this);
            this._onChanged();
        },

        _onPollingPackets: function (args: ICouchPackets, sender) {
            this._sinces[sender.url] = args.lastSeq;
            this._onChanged();
            this._onPackets(args);
        },

        _onPackets: function (args: ICouchPackets) {
            var new_packets = args.packets.map(function (packet) {
                return {
                    addr: Hex.fromString(packet.channelName),
                    data: Hex.fromString(packet.data),
                    seq: packet.seq,
                    id: packet.id
                };
            });
            var p: ICouchMultivaluePackets = { 
                context : args.context,
                since : args.since,
                lastSeq : args.lastSeq,
                packets : new_packets
            }
            this.onPackets.emit(p);
        },

        _onPostingSuccess: function (args) {
            var index = this._unsentPackets.indexOf(args.context);
            if (index !== -1) {
                this._unsentPackets.splice(index, 1);
                this._onChanged();
            }
            this._sendNextPacket();
        },

        _onPostingError: function (errorType) {
            setTimeout((function () {
                this._sendNextPacket();
            }).bind(this), errorType === "timeout" ? 4 : 5000);
        },

        _sendNextPacket: function () {
            if (!this._unsentPackets.length) { return; }
            invariant(this._posting, "posting url was not set");
            var packet = this._unsentPackets[0];
            this._posting.send(packet.channelName, packet.data, packet);
        },

        destroy: function () {
            // end all requests
            throw new Error("Not implemented");
        }

    });

    var typeAdapter: ICouchTransport = <ICouchTransport><any>CouchTransport;
    export = typeAdapter;
