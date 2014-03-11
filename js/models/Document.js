define(["zepto", "appModule"], function ($) {
    "use strict";
    app.factory("Document", function (RepoItem) {
        function Document(entity) {
            this.entity = entity;

        }
        Document.prototype = new RepoItem();
        angular.extend(Document.prototype, {
            getFields: function () {
                return this.getData("fields");
            },
            setField: function (index, name, value) {
                var fields = this.getFields();
                fields[index] = {name: name, value: value};
                this.setData("fields", fields);
            }
        });
        return Document;
    });
});