import React from 'react';

/**
 * General component description.
 */
export class Component1 extends React.Component {
  static propTypes = {
      /**
       * Description of prop "foo".
       */
      foo: React.PropTypes.number,
      /**
       * Description of prop "bar" (a custom validation function).
       */
      bar: function(props, propName, componentName) {
        // ...
      },
      baz: React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string
      ]),
  }

  static defaultProps = {
      /**
       * Foo number of nothing.
       */
      foo: 10000099999
  }

  render () {
      return (<div>Hello</div>);
  }
}

/**
 * General another component description.
 * Blah blah blah...
 * fdfdfsdf
 * fdsfsd
 */
class Component2 extends React.Component {
  displayName = "DUPA";
  static propTypes = {
      /**
       * Description of prop "foo".
       */
      foo: React.PropTypes.number,
      /**
       * Description of prop "bar" (a custom validation function).
       */
      bar: function(props, propName, componentName) {
        // ...
      },
      baz: React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string
      ]),
  }

  render () {
      return (<div>Hello</div>);
  }
}

export default Component2;
