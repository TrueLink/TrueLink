define([
    "zepto",
    "q",
    "react",
    "bind",
    "components/channels/ContactList",
    "components/channels/ContactTlStatus",
    "components/channels/Dialog",
    "modules/channels/contactChannelGroup"
], function ($, Q, React, bind, ContactList, ContactTlStatus, Dialog, ContactChannelGroup) {
    "use strict";

    return React.createClass({
        displayName: "App",
        mixins: [bind],

        getInitialState: function () {

            return {
                currentContact: null
            };
        },

        addContact: function (name) {
            this.props.model.addContact(name);
        },

        selectContact: function (name) {
            this.setState({
                currentContact: this.props.model.contactList[name],
                currentName: name
            });
        },

        render: function () {
            var model = this.props.model;
            var current = this.state.currentContact;

            var contactListComponent = React.DOM.div({className: "large-4 column right-border"},
                React.DOM.h4(null, "Contacts"),
                ContactList({
                    addContact: this.addContact,
                    selectContact: this.selectContact,
                    model: {contacts: this.props.model.contactList }
                }));

            var dialogComponent = !(current && !current.isSync) ? null :
                    React.DOM.div({className: "large-4 column left-border"},
                        React.DOM.h4(null, "Dialog with " + this.state.currentName),
                        Dialog({model: current}));

            var tlstatusComponentWidth = dialogComponent ? "4" : "8";
            var tlstatusComponent = !current ? null :
                    React.DOM.div({className: "large-" + tlstatusComponentWidth + " column right-border"},
                        React.DOM.h4(null, "Tl Status of " + this.state.currentName),
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