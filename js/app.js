(function ($, Q, modules, React) {
    "use strict";

    modules.App = React.createClass({
        displayName: "App",
        getInitialState: function () {
            return {
                changeState: this.changeState,
                currentPage: modules.LoginPage,
                currentPageProps: { message: "welcome" }
            };
        },

        changeState: function (page, props, rootState, errb) {
            var that = this;

            if (!page) {
                changeStateErrorHandler(new Error("Cannot change the state to an empty page"));
            }

            if (!rootState) {
                rootState = {};
            } else if ($.isFunction(rootState)) {
                errb = rootState;
                rootState = {};
            }

            var state = $.extend({}, this.state, {
                currentPage: page,
                currentPageProps: props
            }, rootState);

            $.resolveObj(state).then(function (resolved) {
                that.setState(resolved);
            }, changeStateErrorHandler);


            function changeStateErrorHandler(error) {
                if (errb) {
                    try {
                        errb(error);
                    } catch (errbError) {
                        console.error(errbError);
                    }
                }
                console.error(error);
            }
        },


        render: function () {
            var that = this;
            var rootState = {app: this.state};
            this.state.currentPageProps = this.state.currentPageProps || {};
            return React.DOM.div({id: "app"},
                modules.Menu(rootState),
                !this.state.currentPage ? null :
                        this.state.currentPage($.extend(this.state.currentPageProps, rootState))
            );
        }
    });
}(Zepto, Q, _modules, React));
