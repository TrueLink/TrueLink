define([], function () {
    "use strict";
    return {
        bind: function (fn) {
            return fn.bind(this);
        }
    };
});