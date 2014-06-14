define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    var reactObserver = require("mixins/reactObserver");
    module.exports = React.createClass({
        displayName: "DialogPage",
        mixins: [reactObserver],

        render: function () {
            var dialog = this.state.model;
//            var pageModel = this.state.pageModel;
            var router = this.props.router;
            return React.DOM.div({className: "dialog-page"},
                React.DOM.div({className: "app-page-title"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("dialogs", dialog.profile)
                    }, "Dialog: " + dialog.name)));
        }
    });
});