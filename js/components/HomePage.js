define(["zepto", "q", "react", "tools/bind"], function ($, Q, React, bind) {
    "use strict";

    return React.createClass({
        displayName: "HomePage",
        mixins: [bind],

        render: function () {
            return React.DOM.div(null);
        }
    });
});