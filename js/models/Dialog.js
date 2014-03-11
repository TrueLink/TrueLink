define(["zepto"], function ($) {
    "use strict";
    app.factory("Dialog", function (RepoItem) {
        function Dialog(entity) {
            this.entity = entity;

        }
        Dialog.prototype = new RepoItem();
        angular.extend(Dialog.prototype, {

        });
        return Dialog;
    });
});