define([
    "zepto", "q", "react", "bind", "components/channels/App", "tools/uuid"
], function ($, Q, React, bind, App, newUid) {
    "use strict";

    return React.createClass({
        displayName: "AppList",
        mixins: [bind],

        addClick: function () {
            this.props.add(newUid());
        },
        joinClick: function () {
            //this.props.join(newUid());
        },
        render: function () {

            var apps = {};
            $.each(this.props.apps, function (key, app) {
                apps[key] = App({model: app});
            });

            return React.DOM.div({id: "app", className: "row"},
                React.DOM.div({className: "large-12 columns"}, React.DOM.h1(null, "Apps"),
                        apps,
                        React.DOM.div({className: "row"},
                            React.DOM.div({className: "large-12 columns"},
                                React.DOM.ul({className: "radius button-group"},
                                    React.DOM.li(null, React.DOM.a({onClick: this.addClick, className: "success button"}, "Add app")),
                                    React.DOM.li(null, React.DOM.a({onClick: this.joinClick, className: "success button"}, "Join")))))));
        }
    });
});