define(function (require, exports, module) {/** @jsx React.DOM */

var React = require('react');
var cloneWithProps = require('./utils/cloneWithProps');
var ValidComponentChildren = require('./utils/ValidComponentChildren');
var createChainedFunction = require('./utils/createChainedFunction');

var Pager = React.createClass({displayName: 'Pager',

  propTypes: {
    onSelect: React.PropTypes.func
  },

  render: function () {
    return this.transferPropsTo(
      React.DOM.ul(
        {className:"pager"}, 
        ValidComponentChildren.map(this.props.children, this.renderPageItem)
      )
    );
  },

  renderPageItem: function (child) {
    return cloneWithProps(
      child,
      {
        onSelect: createChainedFunction(child.props.onSelect, this.props.onSelect),
        ref: child.props.ref,
        key: child.props.key
      }
    );
  }
});

module.exports = Pager;
});
