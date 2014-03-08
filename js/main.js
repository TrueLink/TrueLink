$(function () {
    "use strict";

    window.whenObj = function (obj) {
        if ($.isArray(obj)) {
            return Q.all(obj.map(function (item) {
                return whenObj(item);
            }));
        }
        if (typeof obj !== "object" || Q.isPromiseAlike(obj)) {
            return Q.when(obj);
        }
        var newObj = {}, promises = [];
        $.each(obj, function (key, value) {
            promises.push(whenObj(value).then(function (val) {
                newObj[key] = val;
            }));
        });
        return Q.all(promises).then(function () {
            return newObj;
        });
    };
    var state = {
        setState: function (stateObj) {

        }
    };
});