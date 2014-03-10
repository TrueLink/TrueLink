define(["tools/uuid", "q", "zepto"], function (newUid, Q, $) {
    "use strict";

    return {
        when: Q.when,
        whenAll: Q.whenAll,
        extend: $.extend,
        newUid: newUid,
        Promise: Q.Promise
    };
});