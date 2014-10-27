"use strict";
var map = {};
var converter = {
    register : function (from, to, fn, hasRestrictions) {
        if (!map.hasOwnProperty(from)) { map[from] = {}; }
        if (map[from].hasOwnProperty(to)) {
            console.warn("Warning! The converter from " + from + " to " + to + " was overwritten");
        }
        map[from][to] = {fn: fn, r: hasRestrictions || false};
    },
    convert : function (from, to, value) {
        if (!this.canConvertDirectly(from, to)) {
            var mediator = this.getMediator(from, to);
            if (!mediator) {
                throw new Error("The converter from " + from + " to " + to + " is not registered");
            }
            return this.convert(mediator, to, this.convert(from, mediator, value).value);
        }
        return map[from][to].fn(value);
    },
    canConvertDirectly : function (from, to) {
        return !(!map.hasOwnProperty(from) || !map[from].hasOwnProperty(to));
    },

    _getMediator: function (from, to, useAny) {
        var f;
        for (f in map) {
            if (map.hasOwnProperty(f) && f !== "utf8string") {
                if (map[f].hasOwnProperty(to) && this.canConvertDirectly(from, f)) {
                    if ((!map[f][to].r && !map[from][f].r) || useAny) {
                        return f;
                    }
                }
            }
        }
        return null;
    },
    getMediator : function (from, to) {
        return this._getMediator(from, to) || this._getMediator(from, to, true);
    }

};

module.exports = { getInstance: function () { return converter; } };
