    "use strict";
    import React = require("react");
    import MenuComponent = require("ui/menu/MenuComponent");
    import SidebarHiderComponent = require("ui/common/SidebarHider");
    var exp = React.createClass({
        displayName: "AppComponent",
        propTypes:{
            model: React.PropTypes.object.isRequired,
        },
        getInitialState: function () {
            return this._getState();
        },
        _getState: function () {
            var model = this.props.model;
            return {
                menu: model.menu,
                router: model.router,
                currentPage: model.router.currentPage,
                currentProfile: model.currentProfile
            };
        },
        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () { this.props.model.on("changed", this._onModelChanged, this); },
        componentWillUnmount: function () { this.props.model.off("changed", this._onModelChanged, this); },
        render: function () {
            var router = this.state.router;
            var currentProfile = this.state.currentProfile;
            var pageCustomClass = !currentProfile ? "" :
                " stretch-background user-background-" + currentProfile.bg;
            return React.DOM.div({id: "app"},
                React.DOM.audio({ 
                    id:"audiotag1",
                    src:"media/chrap.wav",
                    preload:"auto"
                }),
                SidebarHiderComponent({token: this.state.currentPage},
                    MenuComponent({model: this.state.menu, className: "app-menu", router: router}),
                    React.DOM.div({className: "app-view" + pageCustomClass},
                        this.state.currentPage)));
        }
    });
export = exp;
