define(["tools/uuid", "q", "zeptp"], function (newUid, Q, $) {
    "use strict";

    return {
        when: $q.when,
        whenAll: $q.all,
        extend: $.extend,
        newUid: newUid,
        Promise: Q.Promise
    };
});