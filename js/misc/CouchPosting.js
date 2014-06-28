define(function (require, exports, module) {
    "use strict";
    var extend = require("extend");
    var invariant = require("modules/invariant");
    var eventEmitter = require("modules/events/eventEmitter");
    var $ = require("zepto");

    // works with strings, not multivalues

    function CouchPosting(url) {
        invariant(url, "Can i haz url?");
        this._defineEvent("success");
        this._defineEvent("error");
        this.url = url;
    }
    extend(CouchPosting.prototype, eventEmitter, {
        send: function (channelName, data, context) {
            invariant(typeof channelName === "string", "CouchPosting works with string data");
            invariant(typeof data === "string", "CouchPosting works with string data");
            var packet = {
                ChannelId: channelName,
                DataString: data
            };
            console.log("sending packet to %s, %s bytes", packet.ChannelId, JSON.stringify(packet).length);
            $.ajax({
                type: "POST",
                contentType: "application/json",
                context: this,
                url: this.url,
                data: JSON.stringify(packet),
                success: function (data, status, xhr) { this.fire("success", {data: data, context: context}); },
                error: function (xhr, errorType, error) {
                    console.warn("Packet sending failed: ", error || errorType);
                    this.fire("error", errorType);
                }
            });
        }
    });
    module.exports = CouchPosting;
});