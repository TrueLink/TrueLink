    "use strict";
    var exp = function () {
        return {
            bind: function (fn) {
                return fn.bind(this);
            }
        };
    }
export = exp;
