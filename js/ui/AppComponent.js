define(function (require, exports, module) {
    "use strict";
    var React = require("react");
    var MenuComponent = require("ui/menu/MenuComponent");
    module.exports = React.createClass({
        displayName: "AppComponent",
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var model = this.props.model;

            return {};
        },
        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () { this.props.model.on("changed", this._onModelChanged, this); },
        componentWillUnmount: function () { this.props.model.off("changed", this._onModelChanged); },
        render: function () {
            return React.DOM.div({id: "app"},
                MenuComponent({model: this.props.model.menu}));
//            var currentProfile = this.props.model.currentProfile;
//            var pageCustomClass = !currentProfile ? "" :
//                " stretch-background user-background-" + currentProfile.getData("bg");
//            return React.DOM.div({id: "app"},
//                this.props.menu,
//                React.DOM.div({className: "app-page" + pageCustomClass},
//                    this.props.currentPage));
        }
    });
});