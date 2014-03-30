define([
    "zepto",
    "q",
    "react",
    "bind",
    "components/channels/ContactList",
    "components/channels/ContactTlStatus",
    "components/channels/Dialog",
    "modules/channels/contactChannelGroup",
    "modules/channels/tlkeChannel"
], function ($, Q, React, bind, ContactList, ContactTlStatus, Dialog, ContactChannelGroup, TlkeChannel) {
    "use strict";

    return React.createClass({
        displayName: "App",
        mixins: [bind],

        getInitialState: function () {
            return {
                currentContactName: null
            };
        },

        addContact: function (name) {
            this.props.model.addContact(name);
        },

        selectContact: function (name) {
            this.setState({
                currentContactName: name
            });
        },

        render: function () {
            var model = this.props.model;
            var currentName = this.state.currentContactName || this.props.model.currentContactName;
            var current = currentName ? this.props.model.contactList[currentName] : null;

            var contactListComponent = React.DOM.div({className: "large-4 column"},
                React.DOM.h4(null, "Contacts"),
                ContactList({
                    addContact: this.addContact,
                    selectContact: this.selectContact,
                    model: {contacts: this.props.model.contactList }
                }));

            var dialogComponent = (!(current && !current.isSync)) || (current && current.state !== TlkeChannel.STATE_CONNECTION_ESTABLISHED) ? null :
                    React.DOM.div({className: "large-4 column left-border"},
                        React.DOM.h4(null, "Dialog with " + currentName),
                        Dialog({model: current}));

            var tlstatusComponentWidth = dialogComponent ? "4" : "8";
            var tlstatusComponent = !current ? null :
                    React.DOM.div({className: "large-" + tlstatusComponentWidth + " column right-border"},
                        React.DOM.h4(null, "Tl Status of " + currentName),
                        ContactTlStatus({model: current}));


            return React.DOM.div({className: "row test-app"},
                React.DOM.div({className: "large-12 columns"},
                    React.DOM.hr(null),
                    React.DOM.h3(null, model.id),
                    React.DOM.div({className: "row"},
                        contactListComponent,
                        tlstatusComponent,
                        dialogComponent)));
        }
    });
});