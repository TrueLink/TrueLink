define(["zepto"], function ($) {
    "use strict";
    app.factory("Message", function (RepoItem, Entity) {
        function Message(entity) {
            this.entity = entity;

        }
        Message.prototype = new RepoItem();
        angular.extend(Message.prototype, {

        });

        Message.fromObj = function (obj) {
            return new Message(new Entity(obj));
        };
        return Message;
    });
});