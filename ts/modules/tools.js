define(function (require, exports, module) {
    "use strict";
    var _ = require("./lodash");
    module.exports = {
        extend: _.extend,
        isFunction: _.isFunction,
        isArray: _.isArray,
        isString: _.isString,
        isPlainObject: _.isPlainObject,
        arrayUnique: function (a, searchFn) {
            if (!searchFn) {
                searchFn = Array.prototype.indexOf;
            }
            return a.reduce(function (p, c) {
                if (searchFn.call(p, c) === -1) { p.push(c); }
                return p;
            }, []);
        }
    };
});