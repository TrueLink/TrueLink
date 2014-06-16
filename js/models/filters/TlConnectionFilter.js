define(function (require, exports, module) {
    "use strict";
    var Filter = require("modules/filter/Filter");
    var tools = require("modules/tools");
    var extend = tools.extend;
    var invariant = require("modules/invariant");
    var Utf8String = require("modules/multivalue/utf8string");
    var urandom = require("modules/urandom/urandom");

    // not serializable, removes value.metadata and transforms object to multivalue
    // passes always (for now)
    // sets value.metadata.tlConnection = this._tlConnections on unfilter

    function TlConnectionFilter() {
        this._defineEvent("filtered");
        this._defineEvent("unfiltered");
        this._tlConnections = [];
    }

    TlConnectionFilter.prototype = new Filter();

    extend(TlConnectionFilter.prototype,  {
        addTlConnection: function (conn) {
            if (this._tlConnections.indexOf(conn) !== -1) { return; }
            this._tlConnections.push(conn);
        },
        // called inside tlConnection.sendMessage
        _filter: function (value) {
            if (value.metadata) {
                delete value.metadata;
            }
            return Utf8String.fromString(JSON.stringify(value));
        },
        // called inside tlConnection._receiveMessage
        _unfilter: function (value) {
            var result = JSON.parse(value.as(Utf8String).toString());
            result.metadata = result.metadata || {};
            result.metadata.tlConnection = this._tlConnections;
            return result;
        }
    });

    module.exports = TlConnectionFilter;
});