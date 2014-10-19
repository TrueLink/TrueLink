    "use strict";
    import invariant = require("../modules/invariant");
    import extend = require("tools/extend");
    import Event = require("tools/event");
    import eventEmitter = require("../modules/events/eventEmitter");
    import $ = require("zepto");
    import tools = require("../modules/tools");

    var ajaxTimeout = 20000;

        // works with strings, not multivalues

    export class CouchPolling {
        private channels : Array<any>;
        private url : string;
        private onPackets : Event.Event<ICouchPackets>;
        private timeoutDefer : number;
        private channelsAjax : any;
        private _since : number;
        private _lastSuccess: number;
        private _lastError: number;

        constructor (url, since) {
        invariant(url, "Can i haz url?");
        invariant(since || since === 0, "Can i haz since?");
        this.channels = [];
        this.url = url;
        this._since = since;
        this._lastSuccess = 0;
        this._lastError = 0;
        this.onPackets = new Event.Event<ICouchPackets>("CouchPolling.onPackets");
        this.channelsAjax = null;
        this.timeoutDefer = null;
    }

        on (eName, handler, context) {
            if (eName === "packets") {
                this.onPackets.on(handler, context);
            } else {
                console.log("unknown event in CouchPolling");
            }
        }

        _differentChannels (newChannels) {
            if (this.channels.length !== newChannels.length) {
                return true;
            }
            return this.channels.some(function(i) { return newChannels.indexOf(i) === -1; });
        }

        isPolling (channelName, since) {
            return this._since <= since && this.channels.indexOf(channelName) !== -1;
        }

        beginPolling (channelNames) {
            var newChannels = tools.arrayUnique(channelNames);
            if (this._differentChannels(newChannels)) {
                this.endPolling();
                this.channels = newChannels;
                this._deferredStart();
            }
        }

        _abort () {
            if (this.timeoutDefer) { clearTimeout(this.timeoutDefer); }
            if (!this.channelsAjax) { return; }
            this.channelsAjax.abort();
        }

        endPolling () {
            this._abort();
            this.channels = [];
        }

        _handleResult (data : ICouchLongpollResponse, since) {
            try {
                if (!data || !data.last_seq) {
                    throw new Error("Wrong answer structure");
                }
                this._since = data.last_seq;
                this._onPackets(data, since);
            } catch (e) {
                console.error(e);
            } finally {
                this._deferredStart();
            }
        }

        _onPackets (data: ICouchLongpollResponse, since) {
            var packets : ICouchPackets = {
                lastSeq: data.last_seq,
                since: since,
                packets: data.results.map(function(res: ICouchLongpollEntry) {
                    return {
                        channelName: res.doc.ChannelId,
                        data: res.doc.DataString,
                        seq: res.seq,
                        id: res.id
                    };
                })
            };
            this.onPackets.emit(packets, this);
        }

        _getUrl () {
            var s: string = (this._since == 0)?("now"):this._since.toString();
            return this.url +
                "/_changes?timeout=15000&feed=longpoll&filter=channels/do&Channel=" + this.channels.join(",") +
                "&include_docs=true&since=" + s;
        }

        _start () {
            if (!this.channels.length) { return; }
            var url = this._getUrl();
            this.channelsAjax = $.ajax({
                url: url,
                dataType: "json",
                context: this,
                timeout: ajaxTimeout,
                success: function(data, status, xhr) { 
                    this._lastSuccess = (+new Date());
                    this._handleResult(data, this._since); 
                },
                error: function(xhr, errorType, error) {
                    if (errorType !== "timeout") {
                        this._lastError = (+new Date());
                        console.warn("Message polling failed: ", error || errorType);
                    }
                    // poll anyway
                    this._deferredStart(errorType === "timeout" ? 4 : 500);
                }
            });
        }
        _deferredStart (timeout?: number) {
            timeout = timeout || 4;
            if (this.timeoutDefer) {
                clearTimeout(this.timeoutDefer);
            }
            this.timeoutDefer = setTimeout((function() { this._start(); }).bind(this), timeout);
        }
    }

