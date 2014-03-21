define(["zepto", "q", "react", "components/ContactsPage", "components/DialogsPage", "components/DocumentsPage"], function ($, Q, React, Contacts, Dialogs, Documents) {
    "use strict";

    return React.createClass({
        displayName: "ProfilePage",
        statics: {
            deserialize: function (entity) {

            }
        },
        render: function () {
            return React.DOM.div(null);
        }
    });
});