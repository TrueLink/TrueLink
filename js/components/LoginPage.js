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
        login: function () {
            var password = this.refs.login.getDOMNode().value;
            var masterKeyEncryptor = this.props.crypto.createDbMasterEncryptor(password);
            var login = this.props.login;
            var rootData = this.props.rootData;
            var showError = (function (error) { this.setState({error: error.message || JSON.stringify(error)}); }).bind(this);
            if (rootData) {
                this.loadRootEntity(masterKeyEncryptor).then(function (root) {
                    if (!root) {
                        showError(new Error("Root entity not found. Try to clear the local storage."));
                        return;
                    }
                    login(root, rootData);
                }, showError);
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
            return new Q.Promise((function (resolve, reject) {
                var encryptedData = this.props.rootData, rootData;
                try {
                    rootData = masterKeyEncryptor.decryptData(null, encryptedData);
                    resolve(this.props.db.loadRootEntity(rootData.id, masterKeyEncryptor.decryptData));
                } catch (ex) {
                    reject(new Error("Wrong password"));
                }
            }).bind(this));
        },

        render: function () {
            return React.DOM.div({id: "app"},
                React.DOM.div({className: "default-background-dark login-form"},
                    React.DOM.h1({className: "title"}, this.props.rootData ? "Login" : "Register"),
                    React.DOM.form({onSubmit: this.login},
                        React.DOM.input({ref: "login", type: "text"}),
                        !this.state.error ? null :
                                React.DOM.div(null, this.state.error),
                        React.DOM.input({type: "submit", value: this.props.rootData ? "Login" : "Register"})
                        )));
        }
    });
});