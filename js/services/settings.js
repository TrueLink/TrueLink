define(["zepto"], function ($) {
    "use strict";
    var defaults = { };

    var settings = null;

    function save() {
        localStorage.setItem("settings", JSON.stringify(settings));
    }
    function load() {
        if (!localStorage.getItem("settings")) {
            settings = $.extend({}, defaults);
            save();
        } else {
            settings = JSON.parse(localStorage.getItem("settings"));
        }
    }

    function get(name) {
        return name === undefined ? settings : settings[name];
    }

    function set(name, value) {
        settings[name] = value;
        save();
    }

    function update(obj) {
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                settings[prop] = obj[prop];
            }
        }
        save();
    }
    load();

    return {
        get: get,
        set: set,
        update: update,
        clear: function () {
            settings = {};
            save();
        }
    };
});