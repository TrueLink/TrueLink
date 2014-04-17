define(["./Event"], function (Event) {
    "use strict";
    function EventEmitter() {}

    EventEmitter.prototype = {
        _defineEvent: function (name) {
            this.events = this.events || {};
            this.events[name] = new Event();
        },
        on: function (name, cb, context) {
            if (!this.events[name]) { return; }
            this.events[name].addHandler(cb, context);
        },
        off: function (name, cb) {
            if (!this.events[name]) { return; }
            this.events[name].removeHandler(cb);
        },
        fire: function (name, args) {
            if (!this.events[name]) { return; }
            this.events[name].fire(this, args);
        }
    };
    return EventEmitter;
});