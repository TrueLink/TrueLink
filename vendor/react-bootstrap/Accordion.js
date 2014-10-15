define(function (require, exports, module) {/** @jsx React.DOM */

var React = require('react');
var PanelGroup = require('./PanelGroup');

var Accordion = React.createClass({displayName: 'Accordion',
  render: function () {
    return this.transferPropsTo(
      PanelGroup( {accordion:true}, 
        this.props.children
      )
    );
  }
});

module.exports = Accordion;
});
