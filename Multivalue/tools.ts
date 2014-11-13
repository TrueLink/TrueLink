"use strict";
import _ = require("../modules/lodash");

export var extend = _.extend;
export var isFunction = _.isFunction;
export var isArray = _.isArray;
export var isString = _.isString;
export var isPlainObject = _.isPlainObject;

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
