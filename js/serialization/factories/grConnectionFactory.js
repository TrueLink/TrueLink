define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var prototype = require("./prototype");

    var Tlgr = require("modules/channels/Tlgr");

    function TlConnectionFactory(serializer, grConnection, profile) {
        invariant(serializer, "Can i haz serializer?");
        invariant(grConnection, "Can i haz grConnection?");
        this.serializer = serializer;
        this.grConnection = grConnection;
        this.profile = profile;
    }

    extend(TlConnectionFactory.prototype, prototype, {

    })
});

