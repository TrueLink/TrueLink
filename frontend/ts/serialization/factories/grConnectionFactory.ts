    "use strict";
    import modules = require("modules");
    import invariant = require("invariant");
    import extend = require("../../tools/extend");
    import prototype = require("./prototype");

    import Tlgr = require("Tlgr");

    function GrConnectionFactory(serializer, grConnection, transport) {
        invariant(serializer, "Can i haz serializer?");
        invariant(grConnection, "Can i haz grConnection?");
        invariant(transport, "Can i haz transport?");
        this.serializer = serializer;
        this.grConnection = grConnection;
        this.transport = transport;
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

