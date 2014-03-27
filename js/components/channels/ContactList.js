define(["zepto", "q", "react", "tools/urandom"
    ], function ($, Q, React, urandom) {
    "use strict";

    return React.createClass({
        displayName: "ContactList",

        addContact: function () {
            this.props.addContact(urandom.name());
        },

        addDevice: function () {
            throw new Error("Not implemented");
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
                React.DOM.ul({className: "radius button-group"},
                    React.DOM.li(null, React.DOM.a({className: "tiny button", onClick: this.addContact}, "Add contact")),
                    React.DOM.li(null, React.DOM.a({className: "tiny button", onClick: this.addDevice}, "Add sync"))));
        }
    });
});