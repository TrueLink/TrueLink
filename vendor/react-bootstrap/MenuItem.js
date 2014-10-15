define(function (require, exports, module) {/** @jsx React.DOM */

var React = require('react');
var classSet = require('./utils/classSet');

var MenuItem = React.createClass({displayName: 'MenuItem',
  propTypes: {
    header:   React.PropTypes.bool,
    divider:  React.PropTypes.bool,
    href:     React.PropTypes.string,
    title:    React.PropTypes.string,
    onSelect: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      href: '#'
    };
  },

  handleClick: function (e) {
    if (this.props.onSelect) {
      e.preventDefault();
      this.props.onSelect(this.props.key);
    }
  },

  renderAnchor: function () {
    return (
      React.DOM.a( {onClick:this.handleClick, href:this.props.href, title:this.props.title, tabIndex:"-1"}, 
        this.props.children
      )
    );
  },

  render: function () {
    var classes = {
        'dropdown-header': this.props.header,
        'divider': this.props.divider
      };

    var children = null;
    if (this.props.header) {
      children = this.props.children;
    } else if (!this.props.divider) {
      children = this.renderAnchor();
    }

    return this.transferPropsTo(
      React.DOM.li( {role:"presentation", title:null, href:null, className:classSet(classes)}, 
        children
      )
    );
  }
});

module.exports = MenuItem;
});
