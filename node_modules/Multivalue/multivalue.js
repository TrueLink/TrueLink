var Multivalue = (function () {
    function Multivalue() {
    }
    Multivalue.register = function (from, to, fn, hasRestrictions) {
        if (hasRestrictions === void 0) { hasRestrictions = false; }
        var fromType = from.typeName;
        var toType = to.typeName;
        if (!this.map.hasOwnProperty(fromType)) {
            this.map[fromType] = {};
        }
        if (this.map[fromType].hasOwnProperty(toType)) {
            console.warn("Warning! The converter from " + fromType + " to " + toType + " was overwritten");
        }
        this.map[fromType][toType] = {
            fn: fn,
            r: hasRestrictions
        };
    };
    Multivalue.canConvertDirectly = function (from, to) {
        if (!this.map.hasOwnProperty(from))
            return false;
        if (!this.map[from].hasOwnProperty(to))
            return false;
        return true;
    };
    Multivalue._getMediator = function (from, to, useAny) {
        if (useAny === void 0) { useAny = false; }
        for (var f in this.map) {
            if (this.map.hasOwnProperty(f)) {
                if (!this.map[f].hasOwnProperty(to))
                    continue;
                if (!this.canConvertDirectly(from, f))
                    continue;
                if ((!this.map[f][to].r && !this.map[from][f].r) || useAny) {
                    return f;
                }
            }
        }
        return null;
    };
    Multivalue.getMediator = function (from, to) {
        return this._getMediator(from, to) || this._getMediator(from, to, true);
    };
    Multivalue.convert = function (from, to, value) {
        if (this.canConvertDirectly(from, to)) {
            return this.map[from][to].fn(value);
        }
        var mediator = this.getMediator(from, to);
        if (!mediator) {
            throw new Error("The converter from " + from + " to " + to + " is not registered");
        }
        console.log(mediator);
        return this.convert(mediator, to, this.convert(from, mediator, value));
    };
    Multivalue.prototype.GetType = function () {
        return this.constructor;
    };
    Multivalue.prototype.as = function (target) {
        if (!target || !(target.prototype instanceof Multivalue)) {
            throw new Error("Cannot convert to non-multivalue");
        }
        if (this.GetType().typeName === target.typeName) {
            return this;
        }
        return Multivalue.convert(this.GetType().typeName, target.typeName, this);
    };
    Multivalue.prototype.isEqualTo = function (other) {
        if (!(other instanceof Multivalue)) {
            throw new Error("Cannot compare to non-multivalue");
        }
        var thisType = this.GetType();
        var otherType = other.GetType();
        if (thisType.typeName !== otherType.typeName) {
            throw new Error("Cannot compare " + thisType.typeName + " to " + otherType.typeName);
        }
        return true;
    };
    Multivalue.prototype.serialize = function () {
        throw new Error("Not implemented");
    };
    Multivalue.deserialize = function (obj) {
        throw new Error("Not implemented");
    };
    Multivalue.map = {};
    return Multivalue;
})();
exports.Multivalue = Multivalue;
