define(["zepto", "q", "react", "components/ChannelsTestPage"], function ($, Q, React, ChannelsTestPage) {

    "use strict";

    return React.createClass({
        displayName: "LoginPage",

        getInitialState: function () {
            return {error: null};
        },

        componentDidMount: function () {
            this.refs.login.getDOMNode().focus();
        },

        bind: function (fn) {
            return fn.bind(this);
        },

        login: function () {
            var password = this.refs.login.getDOMNode().value;
            var masterKeyEncryptor = this.props.crypto.createDbMasterEncryptor(password);
            var login = this.props.login;
            var rootData = this.props.rootData;
            var showError = this.bind(function (error) { this.setState({error: error.message || JSON.stringify(error)}); });
            if (rootData) {
                this.loadRootEntity(masterKeyEncryptor).then(this.bind(function (root) {
                    if (!root) {
                        this.setState({
                            error: "Root entity not found. Try to clear the local storage.",
                            showClearButton: true
                        });
                        return;
                    }
                    login(root, rootData);
                }), showError);
            } else {
                this.createRootEntity(masterKeyEncryptor).then(function (result) {
                    login(result.root, result.rootData);
                }, showError);
            }
            return false;
        },

        createRootEntity: function (masterKeyEncryptor) {
            var root = this.props.crypto.createRootEntity();
            var rootData = masterKeyEncryptor.encryptData({id: root.id});
            return this.props.db.saveRootEntity(root, masterKeyEncryptor.encryptData).then(function (saved) {
                return {
                    root: saved,
                    rootData: rootData.encryptedData
                };
            });
        },

        loadRootEntity: function (masterKeyEncryptor) {
            return new Q.Promise(this.bind(function (resolve, reject) {
                var encryptedData = this.props.rootData, rootData;
                try {
                    rootData = masterKeyEncryptor.decryptData(null, encryptedData);
                    resolve(this.props.db.loadRootEntity(rootData.id, masterKeyEncryptor.decryptData));
                } catch (ex) {
                    reject(new Error("Wrong password"));
                }
            }));
        },

        clearLs: function () {
            localStorage.clear();
            location.replace("/");
        },

        render: function () {
            return React.DOM.div({id: "app"},
                React.DOM.div({className: "default-background-dark login-form"},
                    React.DOM.h1({className: "title"}, this.props.rootData ? "Login" : "Register"),
                    React.DOM.form({onSubmit: this.login},
                        React.DOM.input({ref: "login", type: "text"}),
                        !this.state.error ? null :
                                React.DOM.div(null, this.state.error),
                        React.DOM.input({type: "submit", value: this.props.rootData ? "Login" : "Register"}),
                        !this.state.showClearButton ? null :
                                React.DOM.input({type: "button", value: "Clear localStorage", onClick: this.clearLs})
                        )));
        }
    });
});