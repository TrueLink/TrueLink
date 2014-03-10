define(["zepto", "q", "react", "components/Menu", "components/LoginPage", "db", "settings", "services/crypto"], function ($, Q, React, Menu, LoginPage, db, settings, crypto) {
    "use strict";

    function createRootEntity(password) {
        var root, getPasswordFn = function () { return Q(password); };

        var promise = getPasswordFn()
            .then(function (password) {
                // use the same password for encrypt rootEntity id and data
                crypto.setGettingPasswordFn(password);
                db.init(crypto);
                return crypto.createRootEntity();
            })
            .then(function (entity) {
                root = entity;
                return db.save(entity, db.createEncryptor(crypto, crypto.encryptWithMasterKey));
            })
            .then(function (entity) {
                var rootData = {id : entity.id };
                return crypto.encryptWithMasterKey(rootData);
            })
            .then(function (encryptedRootData) {
                settings.set("root", encryptedRootData);
                crypto.setRootEntity(root);
                return root;
            });
        return promise;
    }

    function loadRootEntity(password) {
        var getPasswordFn = function () { return Q(password); };
        var encryptedRootData = settings.get("root");
        var promise = getPasswordFn()
            .then(function (password) {
                crypto.setGettingPasswordFn(password);
                db.init(crypto);
                return crypto.decryptWithMasterKey(encryptedRootData);
            })
            .then(function (rootData) {
                return db.getById(rootData.id, db.createDecryptor(crypto, crypto.decryptWithMasterKey));
            })
            .then(function (root) {
                crypto.setRootEntity(root);
                return root;
            });
        return promise;
    }

    return React.createClass({
        displayName: "App",
        getInitialState: function () {
            return {
                changeState: this.changeState,
                currentPage: LoginPage,
                currentPageProps: {
                    isRegistered: !!settings.get("root"),
                    login: this.login,
                    error: null
                }
            };
        },

        login: function (password) {
            try {
                var loginPromise, that = this;
                if (settings.get("root")) {
                    loginPromise = loadRootEntity(password);
                } else {
                    loginPromise = createRootEntity(password);
                }
                loginPromise.then(function init() {
                    alert("success");
                }, function (error) {
                    that.changeState(null, {error: error.reason || error.message || JSON.stringify(error)});
                });
            } catch (ex) {
                console.error(ex);
            }
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
            props = props ? $.extend(this.state.currentPageProps, props) : this.state.currentPageProps;
            rootState = rootState || {};
            var changeStateErrorHandler = function (error) {
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
            try {
                var that = this;
                var rootState = {app: this.state};
                var pageProps = this.state.currentPageProps || {};
                var pageCustomClass = !this.state.currentProfile ? "" :
                        " stretch-background user-background-" + this.state.currentProfile.getData("bg");
                $.extend(pageProps, rootState);
                return React.DOM.div({id: "app"},
                    Menu($.extend({className: "app-menu"}, rootState)),
                    React.DOM.div({className: "app-page" + pageCustomClass},
                        !this.state.currentPage ? null :
                                this.state.currentPage(pageProps)
                        ));
            } catch (err) {
                console.error(err);
            }
        }
    });
});
