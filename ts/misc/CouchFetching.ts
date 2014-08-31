"use strict";
import invariant = require("modules/invariant");
import extend = require("tools/extend");
import Event = require("tools/event");
import eventEmitter = require("modules/events/eventEmitter");
import $ = require("zepto");

interface ICouchAllChannelMessages {
    offset: number;
    rows: Array<ICouchChannelMessage>;
    total_rows: number;
}

interface ICouchChannelMessage {
    id: string;
    key: string;
    value: any;
}

export var CouchFetching = function(url, context) {
    invariant(url, "Can i haz url?");
    this.onPackets = new Event.Event<ICouchPackets>();

    this.url = url;
    this.context = context;
    this.ajax = null;
}

var ajaxTimeout = 20000;

extend(CouchFetching.prototype, {
    _getUrl: function(channels, since) {
        //return this.url + "/_changes?feed=longpoll&filter=channels/do&Channel=" + channels.join(",") + "&include_docs=true&since=" + since;
        return this.url + "/_design/allChannelMessages/_view/titles?startkey=\""+channels[0]+"\"&endkey=\""+channels[0] + "\"";
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

    _handleResult: function(data: ICouchAllChannelMessages, since) {
        try {
            if (!data || !data.rows) {
                throw new Error("Wrong answer structure");
            }
            this._onPackets(data, since);
        } catch (e) {
            console.error(e);
        }
    },

    _onPackets: function(data: ICouchAllChannelMessages, since) {
        this.onPackets.emit({
            context: this.context,
            since: since,
            lastSeq: undefined,
            packets: data.rows.map(function(res : ICouchChannelMessage) {
                return {
                    channelName: res.value.ChannelId,
                    data: res.value.DataString,
                    seq: undefined,
                    id: res.id
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


