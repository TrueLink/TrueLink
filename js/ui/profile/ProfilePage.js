define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "ProfilePage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var model = this.props.model;
            return {
                profile: model
            };
        },
        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () { this.props.model.on("changed", this._onModelChanged, this); },
        componentWillUnmount: function () { this.props.model.off("changed", this._onModelChanged, this); },
        render: function () {
            return React.DOM.div(null, "Profile Settings: " + this.state.profile.name);
        }
    });
});