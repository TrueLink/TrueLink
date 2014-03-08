(function ($, Q, modules, React) {
    "use strict";

    var test = React.createClass({
        handleClick: function () {
            var promise = Q.promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve("timedout");
                }, 1000);
            });
            this.props.changeState({currentPage: promise}, function (error) { alert(error); });
        },
        render: function () {
            return React.DOM.a({onClick: this.handleClick}, "change");
        }
    });

    modules.App = React.createClass({
        displayName: "App",
        getInitialState: function () {
            return {
                currentPage: "lalala"
            };
        },

        changeState: function (stateObj, errb) {
            var that = this;
            $.resolveObj(stateObj).then(function (resolved) {
                that.setState(resolved);
            }, errb);
        },

        render: function () {
            var that = this;
            return React.DOM.div({id: "app"},
                "currentPage: " + this.state.currentPage,
                React.DOM.span(null, " "),
                test({changeState: this.changeState})
            );
        }
    });
}(Zepto, Q, _modules, React));
