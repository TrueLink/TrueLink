"use strict";
var _ = require("lodash");
exports.extend = _.extend;
exports.isFunction = _.isFunction;
exports.isArray = _.isArray;
exports.isString = _.isString;
exports.isPlainObject = _.isPlainObject;
//    arrayUnique: function (a, searchFn) {
//        if (!searchFn) {
//            searchFn = Array.prototype.indexOf;
//        }
//        return a.reduce(function (p, c) {
//            if (searchFn.call(p, c) === -1) { p.push(c); }
//            return p;
//        }, []);
//    }
//};
