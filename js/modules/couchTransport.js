define(["zepto", "settings"], function ($, Settings) {
    "use strict";

    function CouchTransport(url, channels) {
        this.url = url;
        this.channels = channels || [];
        this.updateSeq = Settings.get("lastSecFor" + url) || 0;
        this.handler = function (channelName, data) {};
        this.pendingAjax = null;
        this.timeoutDefer = null;
        this.messages = [];
    }

    $.extend(CouchTransport.prototype, {
        addChannel: function (channelName, dontStart) {
            if (!channelName) { return; }
            var i;
            for (i = 0; i < this.channels.length; i++) {
                if (this.channels[i] === channelName) { return; }
            }
            this._cancel();
            this.channels.push(channelName);
            if (!dontStart) { this._deferredStart(); }
        },
        deleteChannel: function (channelName) {
            if (!channelName) { return; }
            var i;
            for (i = 0; i < this.channels.length; i++) {
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

            setTimeout(function () {
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
            }, 500);

        },
        _handleResult: function (data) {
            try {
                if (!data || !data.last_seq) {
                    throw new Error("wrong answer structure");
                }
                this.updateSeq = data.last_seq;
                Settings.set("lastSecFor" + this.url, this.updateSeq);
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
                success: function (data, status, xhr) { that._handleResult(data); },
                error: function (xhr, errorType, error) {
                    console.warn("Message sending failed: ", error || errorType);
                    that._deferredStart(5000);
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