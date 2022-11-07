const { JSDOM } = require('jsdom');
const dom = new JSDOM('', { pretendToBeVisual: true });
const g = global;
g.Event = dom.window.Event;
g.document = dom.window.document;
