define(["zepto", "tools/invariant"], function ($, invariant) {
    "use strict";
    function Event() {
        this.handlers = [];
    }
    Event.prototype = {
        fire: function (args, sender) {
            this.handlers.forEach(function (item) {
                try {
                    item.callback.call(item.context, args, sender);
                } catch (ex) {
                    console.error(ex);
                }
            });
        },
        addHandler: function (handler, context) {
            invariant($.isFunction(handler), "handler must be a function");
            if (this.handlers.indexOf(handler) === -1) {
                this.handlers.push({callback: handler, context: context});
            }
        },
        removeHandler: function (handler) {
            var index = this.handlers.map(function (item) { return item.callback; }).indexOf(handler);
            if (index !== -1) {
                this.handlers.splice(index, 1);
            }
        }
    };

    return Event;
});