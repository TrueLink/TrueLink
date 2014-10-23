    "use strict";
    module.exports = function (condition, format, a, b, c, d, e, f) {
        if (format === undefined) {
            throw new Error("invariant requires an error message argument");
        }

        if (!condition) {
            var args = [a, b, c, d, e, f];
            var argIndex = 0;
            var error = new Error(
                    "Invariant Violation: " + format.replace(/%s/g, function () { return args[argIndex++]; })
                );
            debugger;
            throw error;
        }
    };
