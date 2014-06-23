define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var $ = require("zepto");

    var ajaxTimeout = 20000;

    function CouchPolling(url, since) {
        invariant(url, "Can i haz url?");
        invariant(since || since === 0, "Can i haz since?");
        this.channels = [];
        this.url = url;
        this.since = since;
        this._defineEvent("channelPackets");
        this._defineEvent("changedSince");
        this.channelsAjax = null;
        this.timeoutDefer = null;
    }

    extend(CouchPolling.prototype, eventEmitter, {
        _unique: function (arr) {
            var u = {}, a = [], i, l;
            for (i = 0, l = arr.length; i < l; ++i) {
                if (u.hasOwnProperty(arr[i])) {
                    continue;
                }
                a.push(arr[i]);
                u[arr[i]] = 1;
            }
            return a;
        },
        addChannel: function (channelName) {
            if (this.channels.indexOf(channelName) === -1) {
                this._cancel();
                this._deferredStart();
            }
            this.channels.push(channelName);
        },

        reset: function () {
            this._cancel();
            this.channels = [];
        },

        removeChannel: function (channelName) {
            var index = this.channels.indexOf(channelName);
            if (index !== -1) {
                // no need to cancel if the channel was open more than one time
                if (this.channels.indexOf(channelName, index + 1) === -1) {
                    this._cancel();
                    this._deferredStart();
                }
                this.channels.splice(index, 1);
            }
        },

        _handleResult: function (data) {
            try {
                if (!data || !data.last_seq) {
                    throw new Error("Wrong answer structure");
                }
                this.since = data.last_seq;
                this._onChangedSince(this.since);
                this._onResults(data);
            } catch (e) {
                console.error(e);
            } finally {
                this._deferredStart();
            }
        },

        _onResults: function (data) {
            this.fire("channelPackets", {
                packets: data.results.map(function (res) { return {
                    channelName: res.doc.ChannelId,
                    data: res.doc.DataString,
                    seq: res.seq
                }; })
            });
        },

        _getUrl: function () {
            return this.url +
                "/_changes?feed=longpoll&filter=channels/do&Channel=" + this._unique(this.channels).join(",") +
                "&include_docs=true&since=" + this.since;
        },

        _start: function () {
            if (!this.channels.length) { return; }
            var url = this._getUrl();
            this.channelsAjax = $.ajax({
                url: url,
                dataType: "json",
                context: this,
                timeout: ajaxTimeout,
                success: function (data, status, xhr) { this._handleResult(data); },
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
        _cancel: function () {
            if (!this.channelsAjax) { return; }
            this.channelsAjax.abort();
        },
        _deferredStart: function (timeout) {
            timeout = timeout || 4;
            if (this.timeoutDefer) {
                clearTimeout(this.timeoutDefer);
            }
            this.timeoutDefer = setTimeout((function () { this._start(); }).bind(this), timeout);
        },
        _onChangedSince: function (since) {
            this.fire("changedSince", since);
        }
    });
    module.exports = CouchPolling;
});