define(function (require, exports, module) {
    "use strict";
    var invariant = require("../invariant");

    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }
    function Event() {
        this.handlers = [];
    }
    Event.prototype = {
        fire: function (name, args, sender) {
            this.handlers.forEach(function (item) {
                try {
                    item.callback.call(item.context, args, sender);
                } catch (ex) {
                    console.group(name + " event handler failed");
                    console.error(ex);
                    console.groupEnd();
                }
            });
        },
        _indexOf: function (handler, context) {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                if (this.handlers[i].callback === handler && this.handlers[i].context === context) {
                    return i;
                }
            }
            return -1;
        },
        addHandler: function (handler, context) {
            invariant(isFunction(handler), "handler must be a function");
            this.removeHandler(handler, context);
            this.handlers.push({callback: handler, context: context});
        },
        removeHandler: function (handler, context) {
            var index = this._indexOf(handler, context);
            if (index !== -1) {
                this.handlers.splice(index, 1);
            }
        },
        hasHandlers: function () {
            return this.handlers.length > 0;
        }
    };
    module.exports = Event;
});