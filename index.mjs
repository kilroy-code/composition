import { getKey } from '@kilroy-code/api-key/index.mjs';
import { CroquetBlock as Block, Ruled } from '@kilroy-code/blocks/index.mjs';
import { Rule } from '@kilroy-code/rules/index.mjs';
import { nanoid } from 'nanoid';
export const { document } = (typeof window !== 'undefined') ? window : (new (await import('jsdom')).JSDOM('')).window;

export class Content extends Ruled {
}
export class Node extends Ruled {
  get corner() {
    return {left: 10, top: 20};
  }
}
[Content, Node].forEach(kind => Block.register(kind));


export class Display extends Ruled {
  initialize(...rest) {
    setTimeout(() => this.update);
    return super.initialize(...rest);
  }
  get model() { return null; }
  get update() {
    this.mirrors;
    this.updateDisplayParent;
    this.updateGeometry;
    return null;
  }
  get mirrors() {
    let {model, children} = this;
    children.forEach(child => child.parent = null); // Debatable!
    return (model?.children || []).map(modelChild => {
      let type = modelChild.defaulted('displayType') || this.defaulted('displayType');
      return new type().initialize({name: modelChild.name, parent: this, model: modelChild});
    });
  }
  get updateGeometry() {
    return null;
  }
  get updateDisplayParent() {
    if (this.parent) {
      this.parent.display?.append(this.display);
    } else {
      this.display?.remove();
    }
    return true;
  }
  addCssClass(classNameString, element = this.display) {
    classNameString.split(' ').forEach(cssName => element.classList.add(cssName));
    return element;
  }
  createElement(tag, classList = '') {
    return this.addCssClass(classList, document.createElement(tag));
  }
}
export class Box extends Display {
  get display() { return this.createElement('div', 'box'); }
  get updateGeometry() {
    const corner = this.model?.corner || {left: 0, top: 0},
	  {style} = this.display;
    style.left = corner.left + 'px'; 
    style.top = corner.top + 'px';
    return true;
  }
}
export class Body extends Display {
  get display() { return document.body; }
  get updateDisplayParent() { return null; } // Don't remove display from document.
}
[ Display, Body, Box].forEach(kind => Rule.rulify(kind.prototype, {eagerNames: ['update']}));

export class Composition {
  static async create(properties) {
    let app = new this();
    Object.assign(app, properties);
    await app.body;
    return app;
  }
  leave() {
    this.body.model = null;
    return this.rootBlock.leave();
  }
  updateBrowserSearch(key, value) {
    this.search.set(key, value);
    history.replaceState(null, '', this.url.toString());
    return value;
  }
  get url() { return new URL(document.location); }
  get search() { return this.url.searchParams; }
  get placeTag() { return this.search.get('placeTag') || 'block'; } // FIXME default. At least get from the place part of a clean url path.
  get place() { return {latestSession: 'xyz', wireKey: 'secret'}; } // FIXME: get from server persistence.
  get spec() { return this.place.spec; }
  get appName() { return `com.ki1r0y.${this.placeTag}`; }
  get content() { return this.rootBlock.template; }
  // Croquet messages are sent over wss, so they are encrypted. But we also want to keep data from
  // anyone who gains access to croquet servers and yet not allowed into, e.g., a private place.
  // We do this by storing a unique wireKey in the place data, and using that to encrypt the croquet data (including snapshots).
  // Note: if the place is public, they could just join anyway.
  get wireKey() { return this.place.wireKey; }
  get sessionTag() {
    let tagged = this.search.get('session');
    if (tagged === 'new') return this.updateBrowserSearch('session', nanoid(6));
    if (!tagged || tagged === 'lastest') return this.place.latestSession;
    return tagged;
  }
  get rootBlock() {
    return getKey('croquet').then(apiKey => Block.create({
      appId: this.appName,
      name: this.sessionTag,
      apiKey,
      password: this.wireKey,
      options: this.spec
    }));
  }
  get body() {
    let properties = {model: this.content, displayType: Box}; // Demand dependency before executing new Body()'s side-effects.
    return new Body().initialize(properties);
  }
}
[Composition].forEach(kind => Rule.rulify(kind.prototype));

