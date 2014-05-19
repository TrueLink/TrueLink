define(function (require, exports, module) {
    "use strict";
    var invariant = require("invariant");
    var Transport = require("js/models/Transport");
    var Profile = require("js/models/Profile");
    var App = require("js/models/App");
    var Menu = require("js/models/Menu");

    function Factory(serializer) {
        invariant(serializer, "serializer must be provided");
        this.serializer = serializer;
    }

    Factory.prototype = {
        createApp: function () {
            return this._observed(new App(this));
        },
        createProfile: function () {
            return this._observed(new Profile(this));
        },
        createTransport: function () {
            if (!this.transport) {
                this.transport = this._observed(new Transport(this));
            }
            return this.transport;
        },
        createMenu: function () {
            return this._observed(new Menu(this));
        },

        _observed: function (obj) {
            this.serializer.listen(obj);
            return obj;
        }
    };

    module.exports = Factory;
});