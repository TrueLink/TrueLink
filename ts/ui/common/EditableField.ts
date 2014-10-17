    "use strict";
    import React = require("react");
    var exp = React.createClass({
        displayName: "EditableField",
        propTypes: {
            onChanged: React.PropTypes.func.isRequired,
            id: React.PropTypes.string.isRequired,
            inline: React.PropTypes.bool
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
            var basicTag = (!!this.props.inline)?React.DOM.span:React.DOM.div;
            var displayMode = [
                React.DOM.span({className: "editable-display", key: 0}, props.value),
                React.DOM.button({
                    key: 1,
                    className: "editable-edit-button",
                    onClick: this.editMode
                }, " ✎")
            ];
            var editMode = basicTag({className: "editable-input"},
                React.DOM.form({onSubmit: this.onSubmit}, React.DOM.input({
                    ref: "editBox",
                    id: props.id,
                    value: this.state.value,
                    onChange: this.onChange,
                    onKeyUp: this.onKeyUp,
                    onBlur: this.onSubmit
                })));
            return basicTag({className: "editable-field", "data-id":props.id},
                basicTag({className: "editable-label"}, React.DOM.label({htmlFor: props.id}, props.label)),
                this.state.isEditing ? editMode : displayMode);
        }
    });
export = exp;
