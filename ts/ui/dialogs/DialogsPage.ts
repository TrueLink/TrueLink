    "use strict";
    import React = require("react");
    import reactObserver = require("../../mixins/reactObserver");
    import Profile = require("../../models/Profile");

    var exp = React.createClass({
        displayName: "DialogsPage",
        mixins: [reactObserver],
        handleDialogClick: function (dialog) {
            //TODO: make something better here
            var view = "dialog";
            if(dialog instanceof Profile.GroupChat) {
                view = "groupChat";
            }
            this.props.router.navigate(view, dialog);
            return false;
        },
        _appendDialogComponent: function (components, dialog) {
            components[dialog.name] = React.DOM.div({
                className: "generic-block dialog clearfix",
                onClick: this.handleDialogClick.bind(this, dialog)
            },
                React.DOM.div({className: "dialog-image"}, ""),
                React.DOM.div({className: "dialog-title"},
                        dialog.name + (dialog.unreadCount ? " (" + dialog.unreadCount + ")" : "")));
        },

        handleStartDialog: function () {
            var props = this.props;
            props.router.navigate("contacts", props.pageModel.model);
            return false;
        },
        render: function () {
            var profile = this.state.model;
//            var pageModel = this.state.pageModel;
            var router = this.props.router;
            var dialogs = {};
            profile.dialogs.forEach(this._appendDialogComponent.bind(this, dialogs));
            return React.DOM.div({className: "dialogs-page app-page"},
                React.DOM.div({className: "app-page-header"},
                    React.DOM.a({
                        className: "title",
                        href: "",
                        onClick: router.createNavigateHandler("home", profile.app)
                    }, "〈 Dialogs")),
                React.DOM.div({className: "app-page-content has-header"},                    
                    //React.DOM.div({className: "generic-block"},React.DOM.a({className: "button",href: "",onClick: this.handleStartDialog}, "Start new dialog")),
                    dialogs
                    ));
        }
    });
export = exp;
