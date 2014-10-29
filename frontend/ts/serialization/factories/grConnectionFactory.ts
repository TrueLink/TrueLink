    "use strict";
    import modules = require("modules");
    var invariant = modules.invariant;
    import extend = require("../../tools/extend");
    import prototype = require("./prototype");

    import Tlgr = require("Tlgr");

    function GrConnectionFactory(serializer, grConnection, profile) {
        invariant(serializer, "Can i haz serializer?");
        invariant(grConnection, "Can i haz grConnection?");
        this.serializer = serializer;
        this.grConnection = grConnection;
        this.profile = profile;
    }

    extend(GrConnectionFactory.prototype, prototype, {
        createTlgr: function () {
            var tlgr = new Tlgr(this);
            return this._observed(tlgr);
        },

        createRandom: function () {
            return this.getInstance("Random");
        }

    })
    export = GrConnectionFactory;

