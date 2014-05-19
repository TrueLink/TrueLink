define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "DocumentsPage",
        getInitialState: function () {
            return {};
        },
        componentDidMount: function () {  },
        componentWillUnmount: function () {  },
        render: function () {
            return React.DOM.div(null, "Documents Page");
        }
    });
});