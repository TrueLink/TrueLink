define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var eventEmitter = require("modules/events/eventEmitter");
    var $ = require("zepto");

    var ajaxTimeout = 20000;

    function unique(arr) {
        var u = {}, a = [], i, l;
        for (i = 0, l = arr.length; i < l; ++i) {
            if (u.hasOwnProperty(arr[i])) {
                continue;
            }
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
        return a;
    }

    function CouchPolling(url, since, dontLoop) {
        invariant(url, "Can i haz url?");
        invariant(since || since === 0, "Can i haz since?");
        this.channels = [];
        this.url = url;
        this.since = since;
        this.infinite = !dontLoop;
        this._defineEvent("channelPackets");
        this._defineEvent("changedSince");
        this._defineEvent("timedOut");
        this.channelsAjax = null;
        this.timeoutDefer = null;
    }

    extend(CouchPolling.prototype, eventEmitter, {
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

                this.fire("channelPackets", {
                    packets: data.results.map(function (res) { return {
                        channelName: res.doc.ChannelId,
                        data: res.doc.DataString
                    }; }),
                    channels: this.channels
                });

            } catch (e) {
                console.error(e);
            } finally {
                if (this.infinite) {
                    this._deferredStart();
                }
            }
        },

        _start: function () {
            if (!this.channels.length) { return; }
            var url = this.url +
                "/_changes?feed=longpoll&filter=channels/do&Channel=" + unique(this.channels).join(",") +
                "&include_docs=true&since=" + this.since;
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
                    if (errorType !== "abort" && this.infinite) {
                        this._deferredStart(errorType === "timeout" ? null : 5000);
                    }
                    if (errorType === "timeout") {
                        this.fire("timedOut", {channels: this.channels});
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