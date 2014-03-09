define(["zepto", "q", "react", "components/Menu", "components/LoginPage"], function ($, Q, React, Menu, LoginPage) {
    "use strict";

    return React.createClass({
        displayName: "App",
        getInitialState: function () {
            return {
                changeState: this.changeState,
                currentPage: LoginPage,
                currentPageProps: { }
            };
        },

        // changeState([Page, pageProps], [rootStateOverrides], [errb])
        changeState: function (page, props, rootState, errb) {

            if (page && !$.isFunction(page)) {
                rootState = page;
                errb = props;
                page = undefined;
                props = undefined;
            } else {
                if ($.isFunction(props)) {
                    errb = props;
                    props = undefined;
                } else if ($.isFunction(rootState)) {
                    errb = rootState;
                    rootState = undefined;
                }
            }

            page = page || this.state.currentPage;
            props = props || this.state.currentPageProps;
            rootState = rootState || {};
            var changeStateErrorHandler = function () {
                if (errb) {
                    try {
                        errb(error);
                    } catch (errbError) {
                        console.error(errbError);
                    }
                }
                console.error(error);
            };

            var state = $.extend({}, this.state, {
                currentPage: page,
                currentPageProps: props
            }, rootState);

            // prevent recursion
            delete state.currentPageProps.app;

            var that = this;
            Q.whenAll(state).then(function (resolved) {
                that.setState(resolved);
            }, changeStateErrorHandler);
        },


        render: function () {
            var that = this;
            var rootState = {app: this.state};
            this.state.currentPageProps = this.state.currentPageProps || {};
            return React.DOM.div({id: "app"},
                Menu($.extend({className: "app-menu"}, rootState)),
                !this.state.currentPage ? null :
                        this.state.currentPage($.extend(this.state.currentPageProps, rootState))
                );
        }
    });
});
