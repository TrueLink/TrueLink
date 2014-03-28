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

        sort: function (elements) {
            var sorted = {};
            var sortedKeys = Object.keys(elements).sort();
            sortedKeys.forEach(function (key) {
                sorted[key] = elements[key];
            });
            return sorted;
        },

        render: function () {
            var contacts = {}, select = this.select, that = this;
            var sorted = this.sort(this.props.model.contacts);
            $.each(sorted, function (contactName, contactModel) {
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