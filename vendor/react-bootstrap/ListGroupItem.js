define(function (require, exports, module) {/** @jsx React.DOM */

var React = require('react');
var BootstrapMixin = require('./BootstrapMixin');
var classSet = require('./utils/classSet');
var cloneWithProps = require('./utils/cloneWithProps');
var ValidComponentChildren = require('./utils/ValidComponentChildren');

var ListGroupItem = React.createClass({displayName: 'ListGroupItem',
  mixins: [BootstrapMixin],

  propTypes: {
    bsStyle: React.PropTypes.oneOf(['danger','info','success','warning']),
    active: React.PropTypes.any,
    disabled: React.PropTypes.any,
    header: React.PropTypes.renderable,
    onClick: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      bsClass: 'list-group-item'
    };
  },

  render: function () {
    var classes = this.getBsClassSet();

    classes['active'] = this.props.active;
    classes['disabled'] = this.props.disabled;

    if (this.props.href || this.props.onClick) {
      return this.renderAnchor(classes);
    } else {
      return this.renderSpan(classes);
    }
  },

  renderSpan: function (classes) {
    return this.transferPropsTo(
      React.DOM.span( {className:classSet(classes)}, 
        this.props.header ? this.renderStructuredContent() : this.props.children
      )
    );
  },

  renderAnchor: function (classes) {
    return this.transferPropsTo(
      React.DOM.a(
        {className:classSet(classes),
        onClick:this.handleClick}, 
        this.props.header ? this.renderStructuredContent() : this.props.children
      )
    );
  },

  renderStructuredContent: function () {
    var header;
    if (React.isValidComponent(this.props.header)) {
      header = cloneWithProps(this.props.header, {
        className: 'list-group-item-heading'
      });
    } else {
      header = (
        React.DOM.h4( {className:"list-group-item-heading"}, 
          this.props.header
        )
      );
    }

    var content = (
      React.DOM.p( {className:"list-group-item-text"}, 
        this.props.children
      )
    );

    return {
      header: header,
      content: content
    };
  },

  handleClick: function (e) {
    if (this.props.onClick) {
      e.preventDefault();
      this.props.onClick(this.props.key, this.props.href);
    }
  }
});

module.exports = ListGroupItem;

});
