define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var CouchPolling = require("./CouchPolling");

    function CouchGetting(url) {
        invariant(url, "Can i haz url?");
        this._defineEvent("channelPackets");
        this.url = url;
        this.channels = [];
        this.channelsAjax = null;
        this.timeoutDefer = null;
    }

    extend(CouchGetting.prototype, CouchPolling.prototype, {
        _getUrl: function () {
            return this.url +
                "/_changes?filter=channels/do&Channel=" + this._unique(this.channels).join(",") +
                "&include_docs=true";
        },
        _handleResult: function (data) {
            try {
                if (!data || !data.last_seq) {
                    throw new Error("Wrong answer structure");
                }
                this._onResults(data, 0);
            } catch (e) {
                console.error(e);
            } finally {
                this.reset();
            }
        },
        constructor: CouchGetting

    });
    module.exports = CouchGetting;
});