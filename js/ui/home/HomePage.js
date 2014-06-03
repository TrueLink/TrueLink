define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "HomePage",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var pageModel = this.props.pageModel;
            var model = pageModel.model;
            return {
                profiles: model.profiles,
                currentProfile: model.currentProfile
            };
        },
        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () { this.props.pageModel.on("changed", this._onModelChanged, this); },
        componentWillUnmount: function () { this.props.pageModel.off("changed", this._onModelChanged, this); },
        render: function () {
            var profileComponents = {};
            var model = this.props.pageModel.model;
            this.state.profiles.forEach(function (p) {
                profileComponents[p.name] = React.DOM.li({
                    onClick: model.setCurrentProfile.bind(model, p),
                    style: { cursor: "pointer", "margin-left": 20 }
                }, p.name);
            });
            return React.DOM.div(null, "Home page: " + this.state.currentProfile.name,
                React.DOM.ul(null, profileComponents));
        }
    });
});