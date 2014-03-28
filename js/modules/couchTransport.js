define(["zepto", "settings"], function ($, Settings) {
    "use strict";

        var ajaxTimeout = 20000;
    // CouchTransport uses strings as channelName
    function CouchTransport(url, channels, prefix) {
        this.handler = null;
        this.saveKey = (prefix || "") + "_lastSecFor_" + url;
        this.url = url;
        this.channels = channels || [];
        this.updateSeq = Settings.get(this.saveKey) || 0;
        this.pendingAjax = null;
        this.timeoutDefer = null;
        this.messages = [];
    }

    $.extend(CouchTransport.prototype, {
        addChannel: function (channelName) {
            if (!channelName) { return; }
            var i;
            for (i = 0; i < this.channels.length; i += 1) {
                if (this.channels[i] === channelName) { return; }
            }
            this._addChannel(channelName);
        },
        _addChannel: function (channelName) {
            var that = this;
            var url = that.url +
                "/_changes?feed=longpoll&filter=channels/do&Channel=" + channelName +
                "&include_docs=true&since=0";
            $.ajax({
                url: url,
                dataType: "json",
                timeout: ajaxTimeout,
                success: function (data, status, xhr) {
                    that.channels.push(channelName);
                    // will save last_seq and enqueue new start
                    that._handleResult(data);
                    // cancel current polling
                    that._cancel();
                },
                error: function (xhr, errorType, error) {
                    that.channels.push(channelName);
                    console.warn("Shit happened. The further work may be unstable. ", error || errorType);
                }
            });

        },
        deleteChannel: function (channelName) {
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
        setHandler: function (cb) {
            this.handler = cb;
        },
        stop: function () {
            this.messages = [];
            this._cancel();
        },
        sendMessage: function (chId, data) {
            this.messages.unshift({
                ChannelId: chId,
                DataString: data
            });
            if (this.messages.length === 1) {
                this._send();
            }
        },
        _send: function () {
            if (!this.messages.length) { return; }
            var message = this.messages.pop(), that = this;

            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: that.url,
                data: JSON.stringify(message),
                success: function (data, status, xhr) { that._send(); },
                error: function (xhr, errorType, error) {
                    console.warn("Message sending failed: ", error || errorType);
                    that.messages.push(message);
                    setTimeout(function () { that._send(); }, 5000);
                }
            });

        },
        _handleResult: function (data) {
            try {
                if (!data || !data.last_seq) {
                    throw new Error("Wrong answer structure");
                }
                this.updateSeq = data.last_seq;
                Settings.set(this.saveKey, this.updateSeq);
                if (data.results.length < 1) {
                    this._deferredStart();
                } else {
                    var that = this;
                    $.each(data.results, function (key, res) {
                        try {
                            that.handler(res.doc.ChannelId, res.doc.DataString);
                        } catch (err) {
                            console.warn("Result handler failed: ", err);
                        }
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                this._deferredStart();
            }
        },

        _start: function () {
            var that = this;
            if (!that.channels.length) { return; }
            var url = that.url +
                "/_changes?feed=longpoll&filter=channels/do&Channel=" + that.channels.join(",") +
                "&include_docs=true&since=" + that.updateSeq;
            that.pendingAjax = $.ajax({
                url: url,
                dataType: "json",
                timeout: ajaxTimeout,
                success: function (data, status, xhr) { that._handleResult(data); },
                error: function (xhr, errorType, error) {
                    console.warn("Message polling failed: ", error || errorType);
                    if (errorType !== "abort") {
                        that._deferredStart(errorType === "timeout" ? null : 5000);
                    }
                }
            });
        },
        start: function () {
            this._deferredStart();
        },
        _cancel: function () {
            if (!this.pendingAjax) { return; }
            this.pendingAjax.abort();
        },
        _deferredStart: function (timeout) {
            var that = this;
            timeout = timeout || 4;
            if (that.timeoutDefer) {
                clearTimeout(that.timeoutDefer);
            }
            that.timeoutDefer = setTimeout(function () { that._start(); }, timeout);
        }
    });

    return CouchTransport;
});