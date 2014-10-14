define(function (require, exports, module) {/** @jsx React.DOM */

var React = require('react');
var classSet = require('./utils/classSet');

var PageItem = React.createClass({displayName: 'PageItem',

  propTypes: {
    disabled: React.PropTypes.bool,
    previous: React.PropTypes.bool,
    next: React.PropTypes.bool,
    onSelect: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      href: '#'
    };
  },

  render: function () {
    var classes = {
      'disabled': this.props.disabled,
      'previous': this.props.previous,
      'next': this.props.next
    };

    return this.transferPropsTo(
      React.DOM.li(
        {className:classSet(classes)}, 
        React.DOM.a(
          {href:this.props.href,
          title:this.props.title,
          onClick:this.handleSelect,
          ref:"anchor"}, 
          this.props.children
        )
      )
    );
  },

  handleSelect: function (e) {
    if (this.props.onSelect) {
      e.preventDefault();

      if (!this.props.disabled) {
        this.props.onSelect(this.props.key, this.props.href);
      }
    }
  }
});

module.exports = PageItem;
});
