define(["zepto",
    "q",
    "react",
    "components/AppWindow",
    "components/LoginPage",
    "components/HomePage",
    "models/Profile",
    "db",
    "settings",
    "services/crypto"], function ($, Q, React, AppWindow, LoginPage, HomePage, Profile, db, settings, crypto) {
    "use strict";
    function isRegistered() {
        return !!settings.get("root");
    }

    return React.createClass({
        displayName: "App",

        createRootEntity: function (password) {
            return Q.Promise(function (resolve, reject) {
                var root = crypto.createRootEntity();
                var masterKeyEncryptor = crypto.createDbMasterEncryptor(password);
                var rootData = masterKeyEncryptor.encryptData({id: root.id});
                db.saveRootEntity(root, masterKeyEncryptor.encryptData).then(function () {
                    settings.set("root", rootData.encryptedData);
                    resolve(root);
                });
            });
        },

        loadRootEntity: function (password) {
            return Q.Promise(function (resolve, reject) {
                var masterKeyEncryptor = crypto.createDbMasterEncryptor(password);
                var encryptedData = settings.get("root"), rootData;
                try {
                    rootData = masterKeyEncryptor.decryptData(null, encryptedData);
                } catch (ex) {
                    reject(new Error("Wrong password"));
                    return;
                }
                resolve(db.loadRootEntity(rootData.id, masterKeyEncryptor.decryptData));
            });
        },

        login: function (password) {
            var that = this;
            function showError(error) {
                var currentPage = that.state.currentPage;
                that.changeState(LoginPage($.extend(currentPage.props, {error: error.message || JSON.stringify(error)})));
            }

            var rootState = {};
            var loginPromise = isRegistered() ? this.loadRootEntity(password) : this.createRootEntity(password);
            var createFirstProfile = function () { var profile = Profile.create(); rootState.profiles = [profile]; return profile; };

            Q.chain(
                loginPromise,
                function init(root) { return db.init(crypto.createDbEncryptor(root)); },
                db.getProfiles,
                [
                    function ensureProfile(profiles) { return profiles.length > 0 ? profiles[0] : createFirstProfile(); },
                    function setProfiles(profiles) { rootState.profiles = profiles; }
                ],
                function setCurrentProfile(chainResult) { rootState.currentProfile = chainResult[0]; },
                function goHome() { that.changeState(HomePage(), rootState); }
            ).then(null, showError);
        },

        getInitialState: function () {
            return {
                changeState: this.changeState,
                currentPage: LoginPage({
                    isRegistered: isRegistered(),
                    login: this.login,
                    error: null
                })
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
