import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { initEmulator } from "../emulator/emulator.js";

class HarnessElement {
  constructor(tag = "div") { this.tagName = tag; this.children = []; this.dataset = {}; this.style = { setProperty: (key, value) => { this.style[key] = value; } }; this.listeners = {}; this.classList = { toggle: () => {}, add: () => {} }; }
  getContext() { return { measureText: (value) => ({ width: String(value).length * 6 }) }; }
  append(...nodes) { this.children.push(...nodes.flat()); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  setAttribute(name, value) { this[name] = String(value); if (name.startsWith("data-")) this.dataset[name.slice(5).replaceAll(/-([a-z])/g, (_m, letter) => letter.toUpperCase())] = String(value); }
  getAttribute(name) { return this[name]; }
  toggleAttribute(name, force) { this[name] = force; }
  add(option) { this.children.push(option); }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  dispatch(name, detail = {}) { this.listeners[name]?.({ target: this, ...detail }); }
}

function makeHarness(search = "") {
  const ids = ["forge-ui-emulator", "fixture-control", "project-control", "screen-control", "master-variant-control", "master-variant-control-wrap", "locale-control", "layout-control", "page-control", "scroll-control", "state-control", "width-control", "height-control", "scale-control", "map-stash-preview", "master-stash-preview", "extended-preview", "layout-list", "stash-grid", "stash-page", "player-inventory", "inspector-state", "canonical", "title", "state", "selected-layout", "reset", "copy"];
  const nodes = new Map(ids.map((id) => [id, new HarnessElement(id === "inspector-state" ? "output" : "div")]));
  const previewWrap = new HarnessElement("div");
  globalThis.Option = class Option { constructor(text, value) { this.text = text; this.value = value; } };
  globalThis.document = { getElementById: (id) => nodes.get(id) ?? null, createElement: (tag) => new HarnessElement(tag), documentElement: { lang: "" }, querySelector: (selector) => selector === ".preview-wrap" ? previewWrap : null };
  globalThis.window = { innerWidth: 1280, innerHeight: 720, location: { href: `index.html${search}`, search }, history: { replaceState: (_a, _b, url) => { globalThis.window.location.href = url; globalThis.window.location.search = url.split("?")[1] ? `?${url.split("?")[1]}` : ""; } }, addEventListener: () => {} };
  globalThis.history = globalThis.window.history;
  return nodes;
}

function populated(node) { return node.children.filter((slot) => slot.children.length > 0).length; }
function allNodes(node) { return [node, ...node.children.flatMap((child) => child?.children ? allNodes(child) : [])]; }
function assertPublished(nodes, api) {
  const snapshot = api.getSnapshot();
  assert.deepEqual(JSON.parse(nodes.get("inspector-state").textContent), snapshot);
  assert.equal(nodes.get("canonical").textContent, snapshot.canonicalUrl);
  assert.equal(globalThis.window.location.href, snapshot.canonicalUrl);
  const root = nodes.get("forge-ui-emulator");
  for (const [key, value] of Object.entries({ project: snapshot.state.project ?? "cte2", screen: snapshot.state.screen, fixture: snapshot.state.fixture, state: snapshot.state.state, layout: snapshot.state.layout, scroll: snapshot.state.scroll, page: snapshot.state.page, pageCount: snapshot.fixture.pageCount, itemCount: snapshot.fixture.itemCount })) assert.equal(root.dataset[key], String(value), `data-${key}`);
}

test("lightweight DOM harness keeps snapshot, hidden output, data attributes, paging, and scroll synchronized", () => {
  const source = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  const exact = (count) => source.fixtures.find((fixture) => fixture.id === "many").items.slice(0, count).map((item, index) => ({ ...item, slot: index % 96, page: Math.floor(index / 96) }));
  const data = { ...source, fixtures: source.fixtures.map((fixture) => fixture.id === "normal" ? { ...fixture, items: exact(96) } : fixture.id === "many" ? { ...fixture, items: exact(97) } : fixture) };
  const nodes = makeHarness();
  const api = initEmulator(data, {});
  assert.equal(nodes.get("forge-ui-emulator").dataset.ready, "true");
  assert.equal(nodes.get("stash-grid").children.length, 96);
  assert.equal(populated(nodes.get("stash-grid")), 96);
  assertPublished(nodes, api);
  api.setState({ fixture: "many" });
  assert.equal(populated(nodes.get("stash-grid")), 96);
  api.setState({ page: 1 });
  assert.equal(populated(nodes.get("stash-grid")), 1);
  assertPublished(nodes, api);
  nodes.get("layout-list").scrollTop = 36;
  nodes.get("layout-list").dispatch("scroll");
  assert.equal(api.getSnapshot().state.scroll, 2);
  assert.equal(nodes.get("forge-ui-emulator").dataset.scroll, "2");
  assertPublished(nodes, api);
  api.reset();
  assert.equal(api.getSnapshot().state.fixture, "normal");
  assertPublished(nodes, api);
  assert.equal(nodes.get("inspector-state").value, nodes.get("inspector-state").textContent);
  delete globalThis.document;
  delete globalThis.window;
  delete globalThis.history;
  delete globalThis.Option;
});

test("master current variant exposes the explicit 9x9/81 grid contract", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/master-stash.json", import.meta.url), "utf8"));
  const nodes = makeHarness("?screen=master_stash&variant=current");
  const api = initEmulator(data, {});
  assert.equal(api.getSnapshot().state.variant, "current");
  assert.deepEqual(api.getSnapshot().fixture.grid, { columns: 9, rows: 9, slots: 81 });
  assert.equal(api.getSnapshot().fixture.pageSize, 81);
  const currentPanel = allNodes(nodes.get("master-stash-preview")).find((node) => node.dataset.testid === "master-stash-page-0");
  assert.ok(currentPanel);
  const cells = allNodes(currentPanel).filter((node) => node.role === "gridcell");
  assert.equal(cells.length, 81);
  for (const [index, cell] of cells.entries()) {
    assert.equal(cell.getAttribute("aria-colindex"), String((index % 9) + 1));
    assert.equal(cell.getAttribute("aria-rowindex"), String(Math.floor(index / 9) + 1));
  }
  delete globalThis.document;
  delete globalThis.window;
  delete globalThis.history;
  delete globalThis.Option;
});
