define([
    "zepto", "q", "react", "bind", "components/ChannelsTestPage", "tools/uuid"
], function ($, Q, React, bind, ChannelsTestPage, newUid) {
    "use strict";

    return React.createClass({
        displayName: "TestAppList",
        mixins: [bind],

        addClick: function () {
            this.props.add(newUid());
        },
        render: function () {

            var apps = {};
            $.each(this.props.apps, function (key, appProps) {
                apps[key] = React.DOM.div(null,
                    React.DOM.h1({className: "title"}, key),
                    ChannelsTestPage(appProps));
            });

            return React.DOM.div({id: "app"},
                React.DOM.div({className: "default-background-dark wide"},
                    apps,
                    React.DOM.button({onClick: this.addClick}, "Add app")));
        }
    });
});