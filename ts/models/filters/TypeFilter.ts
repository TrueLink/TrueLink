    "use strict";
    var Filter = require("modules/filter/Filter");
    import extend = require("tools/extend");
    var invariant = require("modules/invariant");

    function TypeFilter(typeKey, type) {
        invariant(typeKey && type !== undefined, "typeKey and type must be provided");
        this._defineEvent("filtered");
        this._defineEvent("unfiltered");
        this._typeKey = typeKey;
        this._type = type;
    }

    TypeFilter.prototype = new Filter();

    extend(TypeFilter.prototype,  {
        _filter: function (value) {
            if (value && value[this._typeKey] === this._type) {
                return value;
            }
        },
        _unfilter: function (value) {
            value[this._typeKey] = this._type;
            return value;
        }
    });

    export = TypeFilter;
