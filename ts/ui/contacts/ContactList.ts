    "use strict";
    import React = require("react");
    var exp = React.createClass({
        displayName: "ContactList",
        propTypes: {
            contacts: React.PropTypes.array,
            onClick: React.PropTypes.func,
            checkBoxes: React.PropTypes.bool
        },
        getInitialState: function() {
            return {
                checked: []
            };
        },

        componentWillReceiveProps: function (nextProps) {
            this.initCheckBoxes(nextProps);
        },

        componentWillMount: function () {
            this.initCheckBoxes(this.props);
        },

        initCheckBoxes: function (props) {
            if (props.checkBoxes || true) {
                this.state.checked = new Array(props.contacts.length);
            }
        },

        onClick: function (i, e) {
            this.state.checked[i] = !!!this.state.checked[i];
            this.setState({ checked: this.state.checked });
            e.stopPropagation();
        },

        onCommand: function () {
            if (this.props.onCommand) {
                var contacts = [];
                for (var key in this.state.checked) {
                    if (this.state.checked[key]) {
                        contacts.push(this.props.contacts[key]);
                    }
                }
                this.props.onCommand(contacts);
            }
        },

        render: function() {
            var cancelButton = (this.props.onCancel) ? (React.DOM.input({ type: "button", onClick: this.props.onCancel , value: "Cancel" } )) : null;
            return React.DOM.div({},
                this.props.contacts.map(function(contact, index) {
                    return React.DOM.div({
                        className: "generic-block contact clearfix"
                       // onClick: (this.props.onClick)?(this.props.onClick.bind(null, contact)):(undefined)
                    },
                        React.DOM.div({ className: "contact-image" }, ""),
                        React.DOM.div({ className: "contact-title" }, contact.name, 
                            React.DOM.input({ type: "checkbox", onClick: this.onClick.bind(null, index), checked: this.state.checked[index]})));
                }, this),
                React.DOM.input({ type: "button", onClick: this.onCommand , value: this.props.buttonText} ),
                cancelButton
                );
        }
    });




export = exp;
