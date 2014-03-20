define(["zepto",
    "q",
    "react",
    "components/AppWindow",
    "components/LoginPage",
    "components/HomePage",
    "models/Profile",
    "db",
    "settings",
    "services/crypto",
    "modules/mockForChannels"], function ($, Q, React, AppWindow, LoginPage, HomePage, Profile, db, settings, crypto, Mock) {
    "use strict";
    function isRegistered() {
        return !!settings.get("root");
    }

    return React.createClass({
        displayName: "App",



        login: function (password) {
            var that = this;
            function showError(error) {
                var currentPage = that.state.currentPage;
                that.changeState(LoginPage($.extend(currentPage.props, {error: error.message || JSON.stringify(error)})));
            }

            var rootState = {}, rootEntity = null;
            var loginPromise = isRegistered() ? this.loadRootEntity(password) : this.createRootEntity(password);

            var createFirstProfile = function () {
                var newProfile = Profile.create();
                db.addProfile(newProfile, rootEntity);
                return newProfile;
            };

            Q.chain(
                loginPromise,
                function init(root) { rootEntity = root; return db.init(root); },
                db.getProfiles,
                function setProfiles(profiles) {
                    rootState.profiles = profiles.length ? profiles : [createFirstProfile()];
                    rootState.currentProfile = rootState.profiles[0];
                },
                function goHome() { that.changeState(HomePage(), rootState); }
            ).then(null, showError);
        },

        componentDidMount: function () {
            this.state.channelStuff = new Mock(this.state);
            this.state.channelStuff.stateChanged = (function () {
                this.forceUpdate();
            }).bind(this);
            this.changeState(LoginPage({
                isRegistered: isRegistered(),
                login: this.login,
                error: null,
                app: this.state
            }));
        },

        getInitialState: function () {
            return {
                changeState: this.changeState
            };
        },

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
