    "use strict";
    var invariant = require("modules/invariant");
    import extend = require("tools/extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var $ = require("zepto");
    var tools = require("modules/tools");

    var ajaxTimeout = 20000;


    // works with strings, not multivalues

    function CouchPolling(url, since) {
        invariant(url, "Can i haz url?");
        invariant(since || since === 0, "Can i haz since?");
        this.channels = [];
        this.url = url;
        this._since = since;
        this._defineEvent("packets");
        this.channelsAjax = null;
        this.timeoutDefer = null;
    }

    extend(CouchPolling.prototype, eventEmitter, {
        _differentChannels: function (newChannels) {
            if (this.channels.length !== newChannels.length) {
                return true;
            }
            return this.channels.some(function (i) { return newChannels.indexOf(i) === -1; });
        },

        isPolling: function (channelName, since) {
            return this._since <= since && this.channels.indexOf(channelName) !== -1;
        },

        beginPolling: function (channelNames) {
            var newChannels = tools.arrayUnique(channelNames);
            if (this._differentChannels(newChannels)) {
                this.endPolling();
                this.channels = newChannels;
                this._deferredStart();
            }
        },

        _abort: function () {
            if (this.timeoutDefer) { clearTimeout(this.timeoutDefer); }
            if (!this.channelsAjax) { return; }
            this.channelsAjax.abort();
        },

        endPolling: function () {
            this._abort();
            this.channels = [];
        },

        _handleResult: function (data, since) {
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
        },

        _onPackets: function (data, since) {
            this.fire("packets", {
                lastSeq: data.last_seq,
                since: since,
                packets: data.results.map(function (res) { return {
                    channelName: res.doc.ChannelId,
                    data: res.doc.DataString,
                    seq: res.seq
                }; })
            });
        },

        _getUrl: function () {
            return this.url +
                "/_changes?feed=longpoll&filter=channels/do&Channel=" + this.channels.join(",") +
                "&include_docs=true&since=" + this._since;
        },

        _start: function () {
            if (!this.channels.length) { return; }
            var url = this._getUrl();
            this.channelsAjax = $.ajax({
                url: url,
                dataType: "json",
                context: this,
                timeout: ajaxTimeout,
                success: function (data, status, xhr) { this._handleResult(data, this._since); },
                error: function (xhr, errorType, error) {
                    if (errorType !== "timeout" && errorType !== "abort") {
                        console.warn("Message polling failed: ", error || errorType);
                    }
                    if (errorType !== "abort") {
                        this._deferredStart(errorType === "timeout" ? null : 5000);
                    }
                }
            });
        },
        _deferredStart: function (timeout) {
            timeout = timeout || 4;
            if (this.timeoutDefer) {
                clearTimeout(this.timeoutDefer);
            }
            this.timeoutDefer = setTimeout((function () { this._start(); }).bind(this), timeout);
        }
    });
    export = CouchPolling;
