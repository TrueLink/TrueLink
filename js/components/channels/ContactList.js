define(["zepto", "q", "react", "tools/urandom"
    ], function ($, Q, React, urandom) {
    "use strict";

    return React.createClass({
        displayName: "ContactList",

        add: function () {
            this.props.addContact(urandom.name());
        },

        select: function (name) {
            this.props.selectContact(name);
        },

        render: function () {
            var contacts = {}, select = this.select, that = this;
            $.each(this.props.model.contacts, function (contactName, contactModel) {
                contacts[contactName] = React.DOM.li(null,
                    React.DOM.a({onClick: select.bind(that, contactName)}, contactName));
            });
            return React.DOM.div(null,
                React.DOM.ul(null, contacts),
                React.DOM.button({onClick: this.add}, "add contact"));
        }
    });
});