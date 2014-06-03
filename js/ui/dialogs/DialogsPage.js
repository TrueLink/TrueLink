define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "DialogsPage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var pageModel = this.props.pageModel;
            var model = pageModel.model;

            return {
                profile: model
            };
        },
        handleStartDialog: function () {
            var props = this.props;
            props.router.navigate("contacts", props.pageModel.model);
            return false;
        },
        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () {
            this.props.pageModel.on("changed", this._onModelChanged, this);
        },
        componentWillUnmount: function () {
            this.props.pageModel.off("changed", this._onModelChanged, this);
        },
        _appendDialogComponent: function (components, dialog) {
            components[dialog.name] = React.DOM.div({className: "generic-block dialog clearfix"},
                React.DOM.div({className: "dialog-image"}, ""),
                React.DOM.div({className: "dialog-title"}, dialog.name));
        },
        render: function () {
            var profile = this.state.profile;
            var router = this.props.router;
            var dialogs = {};
            profile.dialogs.forEach(this._appendDialogComponent.bind(this, dialogs));
            return React.DOM.div({className: "dialogs-page"},
                React.DOM.div({className: "app-page-title"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("home", profile.app)
                    }, "Dialogs")),
                React.DOM.div({className: "app-page-content"},
                    React.DOM.div({className: "generic-block"},
                        React.DOM.a({
                            className: "button",
                            href: "",
                            onClick: this.handleStartDialog
                        }, "Start new dialog")),
                    dialogs
                    ));
        }
    });
});