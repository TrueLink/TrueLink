    "use strict";
    var React = require("react");
    var exp = React.createClass({
        displayName: "EditableField",
        propTypes: {
            onChanged: React.PropTypes.func.isRequired,
            id: React.PropTypes.string.isRequired
        },
        getInitialState: function () {
            return {
                isEditing: false,
                value: this.props.value
            };
        },
        editMode: function () {
            this.setState({isEditing: true}, function () {
                var input = this.refs.editBox.getDOMNode();
                input.focus();
                input.select();
            });
        },
        onChange: function (e) { this.setState({value: e.target.value}); },
        onKeyUp: function (e) {
            if (e.key === "Escape") {
                this.setState(this.getInitialState());
            }
        },
        onSubmit: function () {
            this.props.onChanged(this.state.value);
            this.setState({isEditing: false});
            return false;
        },
        render: function () {
            var props = this.props;
            var displayMode = [
                React.DOM.div({className: "editable-display", key: 0}, props.value),
                React.DOM.div({
                    key: 1,
                    className: "editable-edit-button",
                    onClick: this.editMode
                }, "✍")
            ];
            var editMode = React.DOM.div({className: "editable-input"},
                React.DOM.form({onSubmit: this.onSubmit}, React.DOM.input({
                    ref: "editBox",
                    id: props.id,
                    value: this.state.value,
                    onChange: this.onChange,
                    onKeyUp: this.onKeyUp,
                    onBlur: this.onSubmit
                })));
            return React.DOM.div({className: "editable-field"},
                React.DOM.div({className: "editable-label"}, React.DOM.label({htmlFor: props.id}, props.label)),
                this.state.isEditing ? editMode : displayMode);
        }
    });
export = exp;
