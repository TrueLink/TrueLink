define(["zepto", "q", "react", "components/AppWindow", "components/LoginPage", "db", "settings", "services/crypto"], function ($, Q, React, AppWindow, LoginPage, db, settings, crypto) {
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
            var loginPromise = isRegistered() ? this.loadRootEntity(password) : this.createRootEntity(password);

            loginPromise.then(function init(root) {
                db.init(root);
                alert("success");
            }, function (error) {
                var currentPage = that.state.currentPage;
                that.changeState(LoginPage($.extend(currentPage.props, {error: error.message || JSON.stringify(error)})));
            });
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
