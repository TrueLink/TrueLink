    "use strict";
    var Filter = require("modules/filter/Filter");
    var serializable = require("modules/serialization/serializable");
    var tools = require("modules/tools");
    import extend = tools.extend;
    var invariant = require("modules/invariant");
    import model = require("mixins/model");

    // NOT SO INTUITIVE
    // passes if one of (or itself, if not array) value.metadata.tlConnection is found in this._tlConnections
    // sets value.metadata.tlConnection = this._tlConnections on unfilter

    function TlConnectionsFilter() {
        this._defineEvent("filtered");
        this._defineEvent("unfiltered");
        this._defineEvent("changed");
        this._tlConnections = [];
    }

    TlConnectionsFilter.prototype = new Filter();

    extend(TlConnectionsFilter.prototype, serializable, model, {

        serialize: function (packet, context) {
            packet.setLink("_tlConnections", context.getPacket(this._tlConnections));
        },

        deserialize: function (packet, context) {
            this._tlConnections = context.deserialize(packet.getLink("_tlConnections"));

        },
        addTlConnection: function (conn) {
            if (this._tlConnections.indexOf(conn) !== -1) { return; }
            this._tlConnections.push(conn);
            this._onChanged();
        },
        _filter: function (value) {
            if (!value || !value.metadata || !value.metadata.tlConnection) { return; }
            var conns = [].concat(value.metadata.tlConnection);
            var i;
            for (i = 0; i < conns.length; i += 1) {
                if (this._tlConnections.indexOf(conns[i]) !== -1) {
                    return value;
                }
            }
            return;
        },
        _unfilter: function (value) {
            value.metadata = value.metadata || {};
            value.metadata.tlConnection = this._tlConnections;
            return value;
        }
    });

    export = TlConnectionsFilter;
