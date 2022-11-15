import { expect } from 'chai';
import {
  shallow,
  mount,
  render as renderToString
} from 'enzyme';
import React from 'react';

/** @type {any[]} */
const renderers = [shallow, mount, renderToString];

renderers.forEach((render) => {
  const isShallow = render === shallow;
  const isMount = render === mount;
  const isString = render === renderToString;

  describe.only(`${render.name} compat tests`, () => {
    it('can return mixed value HTML content', () => {
      function Button({ label }) {
        return <button type="button">{[label, null, undefined, true, false, 0, 'string']}</button>;
      }

      const wrapper = render(<Button label="Click me" />);
      if (isString) {
        expect(wrapper.html()).to.equal('Click me0string');
      } else {
        expect(wrapper.html()).to.equal('<button type="button">Click me0string</button>');
      }
    });
  });
});
