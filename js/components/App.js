define(["zepto",
    "q",
    "react",
    "bind",
    "components/AppWindow", "components/Menu", "components/HomePage", "components/ChannelsTestPage"
    ], function ($, Q, React, bind, AppWindow, Menu, HomePage, ChannelsTestPage) {
    "use strict";

    var pageTypes = {
        "HomePage": HomePage,
        "ChannelsTestPage": ChannelsTestPage
    };

    function pageFromEntity(aspect, entity) {
        var typeName = entity.getData("pageType");
        if (!typeName || !pageTypes[typeName]) {
            throw new Error("Cannot create page for entity " + entity.getId());
        }
        var type = pageTypes[typeName];
        if (aspect) {
            if (!type.aspects[aspect]) {
                throw new Error("Cannot create page for entity " + entity.getId());
            }
            type = type.aspects[aspect];
        }
        return type.deserialize(entity);
    }

    return React.createClass({
        displayName: "App",
        mixins: [bind],

        getInitialState: function () {
            return {
                currentProfile: null,
                currentPage: null
            };
        },

        createPage: function (id, aspect) {
            var db = this.props.db;
            return db.getById(id, pageFromEntity.bind(aspect));
        },

        navigate: function (guid, aspect) {
            this.createPage(guid, aspect).then(this.bind(function (page) {
                this.setState({currentPage: page});
            }));
        },

        componentDidMount: function () {
            // just go home
            this.navigate(this.props.rootEntity.getId());
        },

        render: function () {
            var profile = this.state.currentProfile;
            return AppWindow({
                currentProfile: profile,
                menu: Menu({currentProfile: profile, rootEntity: this.props.rootEntity}),
                currentPage: this.state.currentPage
            });
        }
    });
});
