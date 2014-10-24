    "use strict";
    import React = require("react");
    import reactObserver = require("../../mixins/reactObserver");
    var exp = React.createClass({
        displayName: "HomePage",
        mixins: [reactObserver],
        render: function () {
            var app = this.state.model;
//            var pageModel = this.state.pageModel;
            var router = this.props.router;
            var profileComponents = {};
            var model = this.props.pageModel.model;
            app.profiles.forEach(function (p) {
                profileComponents[p.name] = React.DOM.li({
                    onClick: model.setCurrentProfile.bind(model, p),
                    style: { "cursor": "pointer", "margin-left": "20" }
                }, p.name);
            });
            return React.DOM.div(null,
                React.DOM.div({className: "app-page-header"},
                    React.DOM.a({
                        className: "title",
                        href: ""//,
                      //  onClick: router.createNavigateHandler("home", app)
                    }, "Home page: " + app.currentProfile.name))
                ,
                React.DOM.ul(null, profileComponents));
        }
    });
export = exp;
