define(function(require, exports, module) {
    "use strict";
    var React = require("react");
    module.exports = React.createClass({
        displayName: "ContactList",
        propTypes: {
            contacts: React.PropTypes.array
        },
        getInitialState: function() {
            return {};
        },

        render: function() {
            return React.DOM.div({},
                this.props.contacts.map(function(contact) {
                    return React.DOM.div({
                        className: "generic-block contact clearfix",
                        onClick: (this.props.onClick)?(this.props.onClick.bind(null, contact)):(undefined)
                    },
                        React.DOM.div({ className: "contact-image" }, ""),
                        React.DOM.div({ className: "contact-title" }, contact.name));
                }, this));
        }
    });
});




