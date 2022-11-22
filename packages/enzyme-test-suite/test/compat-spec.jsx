import { expect } from 'chai';
import {
  shallow,
  mount,
  render as renderToString
} from 'enzyme';
import React, { Fragment } from 'react';

/** @type {any[]} */
const staticRenderers = [renderToString, mount, shallow];
/** @type {any[]} */
const interactiveRenderers = [mount, shallow];

const normalizeDebug = s => s.replace(/\n/g, '').replace(/>\s+/g, '>').replace(/\s+<\//g, '</');

staticRenderers.forEach((render) => {
  const isString = render === renderToString;

  describe.only(`${render.name} static compat tests`, () => {
    // Included in preact adapter tests
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

    // Included in preact adapter tests
    it('can render raw HTML elements', () => {
      const wrapper = render(<div>Hello World!</div>);
      expect(wrapper.html()).to.equal(isString ? 'Hello World!' : '<div>Hello World!</div>');
    });

    // Unnecessary to include in preact adapter tests
    it('can render primitive types', () => {
      if (isString) {
        expect(render(undefined).html()).to.equal(null, 'undefined');
        expect(render(null).html()).to.equal(null, 'null');
        expect(render(true).html()).to.equal(null, 'true');
        expect(render(false).html()).to.equal(null, 'false');
        expect(render(0).html()).to.equal('0', '0');
        expect(render('string').html()).to.equal('string', 'string');
      } else {
        const errorMessage = 'only wrap valid elements';
        expect(() => render(undefined)).to.throw(errorMessage, 'undefined');
        expect(() => render(null)).to.throw(errorMessage, 'null');
        expect(() => render(true)).to.throw(errorMessage, 'true');
        expect(() => render(false)).to.throw(errorMessage, 'false');
        expect(() => render(0)).to.throw(errorMessage, '0');
        expect(() => render('string')).to.throw(errorMessage, 'string');
      }
    })
  });
});

interactiveRenderers.forEach((render) => {
  const isShallow = render === shallow;
  const isMount = render === mount;

  describe.only(`${render.name} interactive compat tests`, () => {

    // Included in preact adapter tests
    it('can return props of child component', () => {
      function ListItem({ label }) {
        return <li>{label}</li>;
      }
      function List() {
        return (
          <ul>
            <ListItem label="test" />
          </ul>
        );
      }
      const wrapper = render(<List />);
      const item = wrapper.find('ListItem');
      expect(item.props()).to.deep.equal({ label: 'test' }); // No children prop
    });

    if (isShallow) {
      // Included in preact adapter tests
      it('renders components that take a function as `children`', () => {
        function Child(props) {
          return props.children();
        }

        function Parent(props) {
          return <Child>{() => <div>Example</div>}</Child>;
        }

        let wrapper = render(<Parent />);
        // console.log(wrapper.props());
        const childrenFunc = wrapper.prop('children');
        wrapper = render(childrenFunc());

        expect(wrapper.text()).to.equal('Example');
      });
    }

    // The purpose of this test was to see what Enzyme passed to
    // nodeToElement. Log the arguments of ReactSixteenAdapter.js
    // nodeToElement to understand what was passed to it.
    // Included in preact adapter tests
    it('nodeToElement accepts all kinds of RST types', () => {
      /** @returns {any} */
      function App() {
        return [undefined, null, true, false, 0, 1n, 'a string'];
      }

      const wrapper = render(<App />);
      if (isShallow) {
        expect(wrapper.getElements()).to.deep.equal([null, null, null, null, null, null, null]);
      } else {
        expect(wrapper.getElements()).to.deep.equal([<App />]);
        expect(wrapper.children().getElements()).to.deep.equal([null, null]);
      }
    });

    // Included in preact adapter tests
    it('properly exposes nested fragments', () => {
      function App() {
        return (
          <Fragment key="1">
            <Fragment key="2">
              <div key="div">
                <Fragment key="3">
                  <Fragment key="4">
                    <span>Hello</span>
                  </Fragment>
                </Fragment>
                <Fragment key="text">World</Fragment>
              </div>
            </Fragment>
          </Fragment>
        );
      }

      // Debug removes fragments itself
      let wrapper = render(<App />);
      // TODO: What do these do?
      const frag1 = App();
      const frag2 = frag1.props.children;
      const divVNode = frag2.props.children
      const frag3 = divVNode.props.children[0];
      const fragText = divVNode.props.children[1];

      expect(frag1.key).to.equal("1");
      expect(frag2.key).to.equal("2");
      expect(divVNode.key).to.equal("div");
      expect(frag3.key).to.equal("3");
      expect(fragText.key).to.equal("text");

      if (isMount) {
        // Debug collapses Fragments
        expect(normalizeDebug(wrapper.debug())).to.equal('<App><div><span>Hello</span>World</div></App>')

        const AppVNode = <App />
        expect(wrapper.first().getElement()).to.deep.equal(AppVNode);
        expect(wrapper.getElements()).to.deep.equal([AppVNode]);
        expect(wrapper.get(0)).to.deep.equal(AppVNode);
        expect(wrapper.at(0).getElement()).to.deep.equal(AppVNode);

        expect(wrapper.children().length).to.equal(1);
        expect(wrapper.children().at(0).key()).to.equal('div');
        expect(wrapper.childAt(0).key()).to.equal('div');

        expect(wrapper.children().children().length).to.equal(2)
        expect(wrapper.children().children().at(0).type()).to.equal('span');
        expect(wrapper.children().children().at(1).getElement()).to.equal(null);

        expect(wrapper.findWhere(w => w.type() === Fragment).length).to.equal(0);
      } else if (isShallow) {
        // Doesn't skip root fragments in shallow rendering
        // getElement => nodeToElement(nodes[0])
        // getElements => nodes.map(nodeToElement)
        // get(i) => getElements[i]
        // at(i) => wrap(nodes[i])


        // Debug exposes root Fragment only
        expect(normalizeDebug(wrapper.debug())).to.equal('<Fragment><div><span>Hello</span>World</div></Fragment>')

        expect(wrapper.first().getElement()).to.deep.equal(frag1);
        expect(wrapper.getElements()).to.deep.equal([frag1]);
        expect(wrapper.get(0)).to.deep.equal(frag1);
        expect(wrapper.at(0).getElement()).to.deep.equal(frag1);

        expect(() => wrapper.dive()).to.throw('only be called on components');
        expect(() => wrapper.shallow()).to.throw('works only with custom components');

        expect(wrapper.children().length).to.equal(1);
        expect(wrapper.children().at(0).key()).to.equal('div');
        expect(wrapper.childAt(0).key()).to.equal('div');

        expect(wrapper.children().children().length).to.equal(2)
        expect(wrapper.children().children().at(0).type()).to.equal('span');
        expect(wrapper.children().children().at(1).getElement()).to.equal(null);


        // Returns first fragment, but collapses nested fragments if
        // Adapter.isFragment is defined
        expect(wrapper.findWhere(w => w.type() === Fragment).length).to.equal(1);
      }
    })

    // Included in preact adapter tests
    it('can test if result contains subtree', () => {
      function ListItem({ label }) {
        return <b>{label}</b>;
      }
      function List() {
        return (
          <ul>
            <li>
              <ListItem label="test" />
            </li>
          </ul>
        );
      }
      const wrapper = render(<List />);

      expect(wrapper.contains(<ListItem label="test" />)).to.be.true;
      expect(
        wrapper.contains(
          <li>
            <ListItem label="test" />
          </li>
        )
      ).to.be.true;
      expect(wrapper.contains(<ListItem label="foo" />)).to.be.false;
      expect(
        wrapper.contains(
          <p>
            <ListItem label="test" />
          </p>
        )
      ).to.be.false;
    });

    // Included in preact adapter tests
    it('getElements() returns expected types for mixed type children', () => {
      /** @returns {any} */
      function App() {
        return [undefined, null, true, false, 0, 1n, 'a string'];
      }

      const wrapper = render(<App />);
      if (isShallow) {
        // Old Preact shallow renderer removes unrenderables. It should preserve
        // all returned output. It also returns the actual values instead of
        // converting them to `null
        //
        // expect(wrapper.getElements()).to.equal(['0', '1', 'a string']);
        expect(wrapper.getElements()).to.deep.equal(App().map(() => null));
      } else {
        // Preact adapter attaches rendered children to props.children. It shouldn't do this
        // {
        //   type: App,
        //   constructor: undefined as any,
        //   key: undefined,
        //   ref: undefined,
        //   props: {
        //     children: ['0', '1', 'a string'],
        //   },
        // }
        expect(wrapper.getElement()).to.deep.equal(<App />);
        // Preact supports bigints. React does not and removes all unrenderables
        // in the output when mount rendering
        expect(wrapper.children().getElements()).to.deep.equal([null, null]);
      }
    });
  });
});
