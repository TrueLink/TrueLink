"use strict";

import prototype = require("./prototype");
import invariant = require("invariant");
import extend = require("../../tools/extend");

import TlConnection = require("../../models/tlConnection/TlConnection");
import GrConnection = require("../../models/grConnection/GrConnection");
import GrConnectionFactory = require("./grConnectionFactory");
import TlConnectionFactory = require("./tlConnectionFactory");

import CouchTransport = require("../../models/tlConnection/CouchTransport");

function SyncFactory(serializer, sync) {
    invariant(serializer, "Can i haz serializer?");
    invariant(sync, "Can i haz sync?");
    this.serializer = serializer;
    this.sync = sync;
}

extend(SyncFactory.prototype, prototype, {
    createTransport: function () : ICouchTransport {
        return this._observed(new CouchTransport.CouchTransport());
    },

    createGrConnection: function () {
        var grConnection = new GrConnection.GrConnection();
        var grConnectionFactory = new GrConnectionFactory(this.serializer, grConnection, this.sync.transport);
        grConnection.setFactory(grConnectionFactory);
        return this._observed(grConnection);
    },

    createTlConnection: function () {
        var tlConnection = new TlConnection.TlConnection();
        var tlConnectionFactory = new TlConnectionFactory(this.serializer, tlConnection, this.sync.transport);
        tlConnection.setFactory(tlConnectionFactory);
        return this._observed(tlConnection);
    },
});

export = SyncFactory;