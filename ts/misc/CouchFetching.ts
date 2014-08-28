"use strict";
import invariant = require("modules/invariant");
import extend = require("tools/extend");
import Event = require("tools/event");
import eventEmitter = require("modules/events/eventEmitter");
import $ = require("zepto");

export interface ICouchFetchResponse {
    context: any;
    since: any;
    lastSeq: any;
    packets: Array<ICouchPacket>;
}

export var CouchFetching = function(url, context) {
    invariant(url, "Can i haz url?");
    this.onPackets = new Event.Event<ICouchFetchResponse>();

    this.url = url;
    this.context = context;
    this.ajax = null;
}

var ajaxTimeout = 20000;

extend(CouchFetching.prototype, {
    _getUrl: function(channels, since) {
        return this.url +
            "/_changes?feed=longpoll&filter=channels/do&Channel=" + channels.join(",") +
            "&include_docs=true&since=" + since;
    },
    on: function(eName, handler, context) {
        if (eName === "packets") {
            this.onPackets.on(handler, context);
        } else {
            console.log("unknown event in CouchFetching");
        }
    },
    beginRequest: function(channelName, since) {
        var url = this._getUrl([channelName], since);
        this.ajax = $.ajax({
            url: url,
            dataType: "json",
            context: this,
            timeout: ajaxTimeout,
            success: function(data, status, xhr) { this._handleResult(data, since); },
            error: function(xhr, errorType, error) {
                if (errorType !== "timeout" && errorType !== "abort") {
                    console.warn("Message polling failed: ", error || errorType);
                }
                if (errorType !== "abort") {
                    this._repeatRequest(channelName, since, errorType === "timeout" ? null : 5000);
                }
            }
        });
    },

    _repeatRequest: function(channelName, since, timeout) {
        setTimeout((function() {
            this.beginRequest(channelName, since);
        }).bind(this), timeout);
    },

    _handleResult: function(data, since) {
        try {
            if (!data || !data.last_seq) {
                throw new Error("Wrong answer structure");
            }
            this._onPackets(data, since);
        } catch (e) {
            console.error(e);
        }
    },

    _onPackets: function(data, since) {
        this.onPackets.emit({
            context: this.context,
            since: since,
            lastSeq: data.last_seq,
            packets: data.results.map(function(res) {
                return {
                    channelName: res.doc.ChannelId,
                    data: res.doc.DataString,
                    seq: res.seq
                };
            })
        }, this);
    },

    endRequest: function() {
        if (this.ajax) {
            this.ajax.abort();
        }
    }
});


