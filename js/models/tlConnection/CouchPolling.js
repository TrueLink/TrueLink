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
        this._defineEvent("channelPacket");
        this._defineEvent("changed");
        this.pendingAjax = null;
        this.timeoutDefer = null;
    }

    extend(CouchPolling.prototype, eventEmitter, {
        addChannel: function (channelName) {
            console.log("adding addr %s to %s", channelName, this.url);
            if (!channelName) { return; }
            var i;
            for (i = 0; i < this.channels.length; i += 1) {
                if (this.channels[i] === channelName) { return; }
            }
            this._addChannel(channelName);
        },

        stop: function () {
            this.messages = [];
            this._cancel();
        },

        removeChannel: function (channelName) {
            if (!channelName) { return; }
            var i;
            for (i = 0; i < this.channels.length; i += 1) {
                if (this.channels[i] === channelName) {
                    this._cancel();
                    this.channels.splice(i, 1);
                    this._deferredStart();
                    return;
                }
            }
        },

        _addChannel: function (channelName) {
            var url = this.url +
                "/_changes?feed=longpoll&filter=channels/do&Channel=" + channelName +
                "&include_docs=true&since=0";
            $.ajax({
                url: url,
                dataType: "json",
                timeout: ajaxTimeout,
                context: this,
                success: function (data, status, xhr) {
                    this.channels.push(channelName);
                    // will save last_seq and enqueue new start
                    this._handleResult(data);
                    // cancel current polling
                    this._cancel();
                },
                error: function (xhr, errorType, error) {
                    this.channels.push(channelName);
                    if (errorType !== "timeout") {
                        console.warn("Shit happened. The further work may be unstable. ", error || errorType);
                    }
                    this._deferredStart();
                    this._cancel();
                }
            });

        },

        _handleResult: function (data) {
            try {
                if (!data || !data.last_seq) {
                    throw new Error("Wrong answer structure");
                }
                this.since = data.last_seq;
                this.onChanged();
                if (data.results.length < 1) {
                    this._deferredStart();
                } else {
                    data.results.forEach(function (res) {
                        this.fire("channelPacket", {channelName: res.doc.ChannelId, data: res.doc.DataString});
                    }, this);
                }
            } catch (e) {
                console.error(e);
            } finally {
                this._deferredStart();
            }
        },

        _start: function () {
            if (!this.channels.length) { return; }
            var url = this.url +
                "/_changes?feed=longpoll&filter=channels/do&Channel=" + this.channels.join(",") +
                "&include_docs=true&since=" + this.since;
            this.pendingAjax = $.ajax({
                url: url,
                dataType: "json",
                context: this,
                timeout: ajaxTimeout,
                success: function (data, status, xhr) { this._handleResult(data); },
                error: function (xhr, errorType, error) {
                    console.warn("Message polling failed: ", error || errorType);
                    if (errorType !== "abort") {
                        this._deferredStart(errorType === "timeout" ? null : 5000);
                    }
                }
            });
        },
        _cancel: function () {
            if (!this.pendingAjax) { return; }
            this.pendingAjax.abort();
        },
        _deferredStart: function (timeout) {
            timeout = timeout || 4;
            if (this.timeoutDefer) {
                clearTimeout(this.timeoutDefer);
            }
            this.timeoutDefer = setTimeout((function () { this._start(); }).bind(this), timeout);
        },
        onChanged: function () {
            this.fire("changed", this);
        },
        onChannelPacket: function () {
            var channelId = "";
            var data = "";
            this.fire("channelPacket", {channelId: channelId, channelData: data});
        }
    });

    module.exports = CouchPolling;
});