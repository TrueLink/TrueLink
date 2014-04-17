define([], function () {
    "use strict";
    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    return function (obj) {
        return obj && isFunction(obj.as);
    };
});