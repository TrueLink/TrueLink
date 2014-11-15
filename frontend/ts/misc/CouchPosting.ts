    "use strict";
    import modules = require("modules");
    import extend = require("../tools/extend");
    import invariant = require("invariant");
    var eventEmitter = modules.events.eventEmitter;
import $=require("zepto");
    var SHA1 = modules.cryptography.sha1_crypto_js;
var Hex = modules.multivalue.hex;
var Utf8String = modules.multivalue.utf8string;
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
            var hash = SHA1(new Utf8String(channelName + data)).as(Hex).serialize();
            console.log('hash:', hash);
            var packet = {
                _id: hash,
                ChannelId: channelName,
                DataString: data
            };
            $.ajax({
                type: "POST",
                contentType: "application/json",
                context: this,
                url: this.url,
                data: JSON.stringify(packet),
                success: function (data, status, xhr) { this.fire("success", {data: data, context: context}); },
                error: function (xhr, errorType, error) {
                    if (xhr.status == 409) {
                        console.warn('Conflict, probably we sent packet multiple times');
                        this.fire("success", {data: data, context: context});
                    } else {
                        console.warn("Packet sending failed: ", error || errorType);
                        this.fire("error", errorType);
                    }
                }
            });
        }
    });
    export = CouchPosting;
