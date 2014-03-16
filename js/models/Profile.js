define(["zepto", "models/RepoItem", "tools/urandom"], function ($, RepoItem, urandom) {
    "use strict";
    function Profile(entity) {
        this.entity = entity;

    }
    Profile.prototype = new RepoItem();
    $.extend(Profile.prototype, {
        getUsername: function () { return this.getData("username"); },
        getUserBackground: function () {
            var bg = this.getData("bg");
            return parseInt(bg, 10) || 0;
        }
    });
    Profile.create = function (username, bg) {
        username = username || urandom.name();
        bg = bg || 0;
        return new Profile(new Entity({username: username, bg: bg}));
    };
    Profile.deserialize = function (entity) {
        return new Profile(entity);
    };

    return Profile;
});