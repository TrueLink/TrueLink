import $=require("zepto");
import Q = require("q");
"use strict";
    function resolve(obj) {
        if ($.isArray(obj)) {
            return Q.all(obj.map(function (item) {
                return resolve(item);
            }));
        }
        if (typeof obj !== "object" || Q.isPromiseAlike(obj) || obj === null) {
            return Q.when(obj);
        }
        var newObj = {}, promises = [];

        $.each(obj, function (key, value) {
            promises.push(resolve(value).then(function (val) {
                newObj[key] = val;
            }));
        });
        return Q.all(promises).then(function () {
            return newObj;
        });
    }

    // chain(initialPromiseOrValue, fn1, fn2, [fn3.1, fn3.2], fn4)
    // fn3.1 and fn3.2 runs at parallel, fn4 is called with array of resolved values
    function chain() {
        var chainLinks = Array.prototype.slice.call(arguments);
        var initialValue = chainLinks.shift();

        function getParallel(fns) {
            return function parallel(value) {
                return Q.all(fns.map(function (fn) { return fn(value); }));
            };
        }
        return chainLinks.reduce(function (soFar, f) {
            return soFar.then($.isArray(f) ? getParallel(f) : f);
        }, Q(initialValue));
    }
    (<any>Q).whenAll = resolve;
    (<any>Q).chain = chain;
   // window.q = Q;
export var q = Q;