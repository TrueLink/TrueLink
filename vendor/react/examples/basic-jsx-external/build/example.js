/**
 * @jsx React.DOM
 */
var ExampleApplication = React.createClass({displayName: 'ExampleApplication',
  render: function() {
    var elapsed = Math.round(this.props.elapsed  / 100);
    var seconds = elapsed / 10 + (elapsed % 10 ? '' : '.0' );
    var message =
      'React has been successfully running for ' + seconds + ' seconds.';

    return (
      React.DOM.div(null, 
        React.DOM.svg(null, 
          React.DOM.font-face(null)
        ),
        React.DOM.p(null, message)
      )
    );
  }
});

var start = new Date().getTime();

setInterval(function() {
  React.renderComponent(
    ExampleApplication( {elapsed:new Date().getTime() - start} ),
    document.getElementById('container')
  );
}, 50);
