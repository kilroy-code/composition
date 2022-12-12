import { tick } from '@kilroy-code/utilities/delay.mjs';
import { Croquet } from '@kilroy-code/utilities/croquet.mjs';
import { Composition, document } from '../index.mjs';
Croquet.App.root = false; // Disable the default Croquet overlay so we can see Jasmine report from start to finish.

describe('Application', function () {
  let app, nodes, nodeA, nodeB, body, boxA, boxB;
  beforeAll(async function () {
    app = await Composition.create({spec: {type: 'Content', name: 'nodes', specs: [
      {type: 'Node', name: 'a'},
      {type: 'Node', name: 'b', corner: {left: 40, top: 60}}
    ]}});
    body = await app.body;
    nodes = await app.content;

    nodeA = nodes.getChild('a');
    nodeB = nodes.getChild('b');

    await tick(); // Display children get created asynchronously.
    await tick(); // It can take two...
    boxA = body.getChild('a');
    boxB = body.getChild('b');
  });
  afterAll(async function () {    
    app.leave();
    expect(nodes.children.length).toBe(0);
    await tick(); // Display children get removed asynchronously.
    expect(body.children.length).toBe(0);
    await tick(); // While we tell the DOM the new information as we add/remove Display nodes, the DOM acts on this asynchronously.
    expect(document.querySelectorAll('div.box').length).toBe(0);
  });
  it('has expected hierarchy.', function () {
    expect(nodeA.parent).toBe(nodes);
    expect(nodeB.parent).toBe(nodes);
    expect(nodes.parent).toBe(null); // Content is not allowed to see app.
    expect(boxA.parent).toBe(body);
    expect(boxB.parent).toBe(body);

    // Currently app.body and app.content are ordinary rules, not children.

    expect(body.getChild('a')).toBe(boxA);
    expect(body.getChild('b')).toBe(boxB);
    expect(app.content).toBe(nodes); // Composition holds content in an ordinary rule, not as a child.
    expect(nodes.getChild('a')).toBe(nodeA);
    expect(nodes.getChild('b')).toBe(nodeB);
  });
  it('has expected models.', function () {
    expect(boxA.model).toBe(nodeA);
    expect(boxB.model).toBe(nodeB);
    expect(body.model).toBe(nodes);
  });
  it('boxes are div.box.', function () {
    expect(boxA.display.tagName).toBe('DIV');
    expect(boxB.display.tagName).toBe('DIV');
    expect(boxA.display.classList.contains('box')).toBeTruthy();
    expect(boxB.display.classList.contains('box')).toBeTruthy();
  });
  it('box style matches model corner.', function () {
    expect(boxA.display.style.left).toBe(nodeA.corner.left + 'px');
    expect(boxA.display.style.top).toBe(nodeA.corner.top + 'px');
    expect(boxB.display.style.left).toBe(nodeB.corner.left + 'px');
    expect(boxB.display.style.top).toBe(nodeB.corner.top + 'px');
  });
  it('tracks changes to model on next tick', async function () {
    let bCorner = nodeB.corner,
	aCorner = nodeA.corner;
    nodeB.corner = {left: bCorner.left + 10, top: bCorner.top}; // The individual corner left and right are not rules. Must set as a whole!
    nodeA.corner = {left: aCorner.left, top: aCorner.top + 10};
    await tick();
    await tick(); // It can take two...
    expect(boxB.display.style.left).toBe(nodeB.corner.left + 'px');
    expect(boxA.display.style.top).toBe(nodeA.corner.top + 'px');
    nodeB.corner = bCorner;
    nodeA.corner = aCorner;
    await tick();
    await tick(); // It can take two...
  });
  it('box displays are in document.', async function () {
    await tick(); // If this test runs soon enough after beforeAll, the DOM may not yet have responded to appending elements.
    let divBoxes = document.querySelectorAll('div.box'),
	boxDisplays = [boxA.display, boxB.display];
    expect(divBoxes.length).toBe(boxDisplays.length);
    for (let element of divBoxes) {
      expect(boxDisplays).toContain(element);
    }
  });
})
