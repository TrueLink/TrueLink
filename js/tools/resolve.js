define(["zepto", "q"], function ($, Q) {
    "use strict";
    function resolve(obj) {
        if ($.isArray(obj)) {
            return Q.all(obj.map(function (item) {
                return resolve(item);
            }));
        }
        if (typeof obj !== "object" || Q.isPromiseAlike(obj)) {
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
    Q.whenAll = resolve;
});