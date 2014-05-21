define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "HomePage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var model = this.props.model;

            return {
                profiles: model.profiles,
                currentProfile: model.currentProfile
            };
        },
        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () { this.props.model.on("changed", this._onModelChanged, this); },
        componentWillUnmount: function () { this.props.model.off("changed", this._onModelChanged); },
        render: function () {
            var profileComponents = {};
            var model = this.props.model;
            this.state.profiles.forEach(function (p) {
                profileComponents[p.name] = React.DOM.p({onClick: model.setCurrentProfile.bind(model, p)}, p.name);
            });
            return React.DOM.div(null, "Home page: " + this.state.currentProfile.name,
                profileComponents);
        }
    });
});