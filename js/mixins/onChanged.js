define(function (require, exports, module) {
    "use strict";
    module.exports = {
        onChanged: function () { this.fire("changed", this); }
    };
});