    "use strict";
    var Filter = require("modules/filter/Filter");
    var tools = require("modules/tools");
    import extend = tools.extend;
    var invariant = require("modules/invariant");
    var Utf8String = require("modules/multivalue/utf8string");

    // not serializable, removes value.metadata and transforms object to multivalue
    // passes always (for now)
    // sets value.metadata.tlConnection = this._tlConnection on unfilter

    function TlConnectionFilter(conn) {
        this._defineEvent("filtered");
        this._defineEvent("unfiltered");
        this._tlConnection = conn;
    }

    TlConnectionFilter.prototype = new Filter();

    extend(TlConnectionFilter.prototype,  {
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
            result.metadata.tlConnection = this._tlConnection;
            return result;
        }
    });

    export = TlConnectionFilter;
