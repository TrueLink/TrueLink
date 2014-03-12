define(["zepto", "q", "react", "components/AppWindow", "components/LoginPage", "db", "settings", "services/crypto"], function ($, Q, React, AppWindow, LoginPage, db, settings, crypto) {
    "use strict";

    function createRootEntity(password) {
        //var rootData = {id : entity.id };
        //settings.set("root", encryptedRootData);
        //return crypto.createRootEntity();
    }

    function loadRootEntity(password) {

    }

    function isRegistered() {
        return !!settings.get("root");
    }

    return React.createClass({
        displayName: "App",
        getInitialState: function () {
            return {
                changeState: this.changeState,
                currentPage: LoginPage({
                    isRegistered: !!settings.get("root"),
                    login: this.login,
                    error: null
                })
            };
        },

        login: function (password) {
            try {
                var that = this;
                var loginPromise = isRegistered ? loadRootEntity(password) : createRootEntity(password);

                loginPromise.then(function init() {
                    alert("success");
                }, function (error) {
                    that.changeState(null, {error: error.message || JSON.stringify(error)});
                });
            } catch (ex) {
                console.error(ex);
            }
        },

        // changeState([createdPage], [rootStateOverrides])
        changeState: function (page, rootState) {
            rootState = rootState || {};
            page = page || this.state.currentPage;
            this.setState($.extend(this.state, rootState, {
                currentPage: page
            }));
        },


        render: function () {
            return AppWindow({app: this.state, currentPage: this.state.currentPage});
        }
    });
});
