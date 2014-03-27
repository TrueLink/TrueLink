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
        render: function () {

            var apps = {};
            $.each(this.props.apps, function (key, app) {
                apps[key] = App({model: {id: key}});
            });

            return React.DOM.div({id: "app", className: "row"},
                React.DOM.div({className: "large-12 columns"}, React.DOM.h1(null, "Apps"),
                        apps,
                        React.DOM.div({className: "row"},
                            React.DOM.div({className: "large-12 columns"}, React.DOM.button({onClick: this.addClick}, "Add app")))));
        }
    });
});