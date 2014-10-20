    "use strict";

    var Event = require("./Event");
    var invariant = require("../invariant");

    module.exports = {
        _defineEvent: function (name) {
            this.events = this.hasOwnProperty("events") ? this.events : {};
            this.events[name] = new Event();
        },
        _checkEvent: function (name) {
            invariant(this.events && this.events[name], "No %s event defined for this emitter", name);
        },
        on: function (name, cb, context) {
            this._checkEvent(name);
            this.events[name].addHandler(cb, context);
        },
        off: function (name, cb, context) {
            this._checkEvent(name);
            this.events[name].removeHandler(cb, context);
        },
        fire: function (name, args) {
            this._checkEvent(name);
            this.events[name].fire(name, args, this);
        },
        checkEventHandlers: function () {
            if (!this.events) { return; }
            var unhandled = [], name;
            for (name in this.events) {
                if (this.events.hasOwnProperty(name) && !this.events[name].hasHandlers()) {
                    unhandled.push('"' + name + '"');
                }
            }
            if (unhandled.length > 0) {
                console.warn("No one is listening for events %s of ", unhandled.join(", "), this);
            }
        }
    };
