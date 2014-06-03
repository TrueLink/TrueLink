define(function (require, exports, module) {
    "use strict";
    var invariant = require("modules/invariant");
    var extend = require("extend");
    var prototype = require("./prototype");


    function TlConnectionFactory(serializer) {
        invariant(serializer, "Can i haz serializer?");
        this.serializer = serializer;
        this.profile = null;
    }

    extend(TlConnectionFactory.prototype, prototype, {
        setProfile: function (profile) {
            this.profile = profile;
        },

        createTlkeBuilder: function () {  },
        createTlhtBuilder: function () {  }
    });

    module.exports = TlConnectionFactory;
});