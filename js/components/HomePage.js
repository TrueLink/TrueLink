define(["zepto", "q", "react", "bind"], function ($, Q, React, bind) {
    "use strict";

    return React.createClass({
        displayName: "HomePage",
        mixins: [bind],

        render: function () {
            return React.DOM.div(null);
        }
    });
});