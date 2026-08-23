import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DEFAULT_CTE2_PROJECT, initEmulator } from "../emulator/emulator.js";

class Node {
  constructor(tag = "div") { this.tagName = tag; this.children = []; this.dataset = {}; this.listeners = {}; this.attributes = {}; this.style = { setProperty: (key, value) => { this.style[key] = value; } }; this.classList = { add: (...names) => { this.className = `${this.className ?? ""} ${names.join(" ")}`.trim(); }, remove: (...names) => { this.className = (this.className ?? "").split(/\s+/).filter((name) => !names.includes(name)).join(" "); }, contains: (name) => (this.className ?? "").split(/\s+/).includes(name), toggle: (name, force) => { if (force) this.classList.add(name); else this.classList.remove(name); } }; }
  append(...children) { this.children.push(...children.flat()); }
  replaceChildren(...children) { this.children = [...children]; }
  add(option) { this.children.push(option); }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  dispatch(type, detail = {}) { const event = { type, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...detail }; this.listeners[type]?.(event); return event; }
  setAttribute(name, value) { this[name] = String(value); this.attributes[name] = String(value); if (name.startsWith("data-")) this.dataset[name.slice(5).replaceAll(/-([a-z])/g, (_m, c) => c.toUpperCase())] = String(value); }
  getAttribute(name) { return this[name]; }
  removeAttribute(name) { delete this[name]; delete this.attributes[name]; }
  toggleAttribute(name, value) { this[name] = value; }
  remove() { this.removed = true; }
  getContext() { return { measureText: (value) => ({ width: String(value).length * 6 }) }; }
  getBoundingClientRect() { return this.rect ?? { left: 0, top: 0, width: 474, height: 326 }; }
  querySelector(selector) { for (const child of this.children) { if (selector === `.${child.className}` || selector === `[data-testid="${child.dataset?.testid}"]` || selector === `#${child.id}`) return child; const nested = child?.querySelector?.(selector); if (nested) return nested; } return null; }
}

function harness(search = "") {
  const ids = ["forge-ui-emulator", "fixture-control", "project-control", "screen-control", "master-variant-control", "master-variant-control-wrap", "locale-control", "layout-control", "page-control", "scroll-control", "state-control", "width-control", "height-control", "scale-control", "map-stash-preview", "master-stash-preview", "extended-preview", "layout-list", "stash-grid", "stash-page", "stash-page-previous", "stash-page-next", "player-inventory", "inspector-state", "canonical", "alignment-badge", "title", "state", "selected-layout", "reset", "reload-assets", "copy"];
  const nodes = new Map(ids.map((id) => [id, new Node(id === "inspector-state" ? "output" : "div")]));
  const wrap = new Node("div");
  nodes.get("map-stash-preview").rect = { left: 0, top: 0, width: 960, height: 540 };
  globalThis.Option = class Option { constructor(text, value) { this.text = text; this.value = value; } };
  globalThis.document = { getElementById: (id) => nodes.get(id) ?? null, createElement: (tag) => new Node(tag), body: new Node("body"), documentElement: {}, querySelector: (selector) => selector === ".preview-wrap" ? wrap : null };
  globalThis.window = { innerWidth: 1280, innerHeight: 720, location: { href: `index.html${search}`, search }, history: { replaceState: (_a, _b, url) => { window.location.href = url; window.location.search = url.includes("?") ? url.slice(url.indexOf("?")) : ""; } }, addEventListener() {} };
  globalThis.history = window.history;
  return nodes;
}

function cleanup() { delete globalThis.document; delete globalThis.window; delete globalThis.history; delete globalThis.Option; }

test("map runtime seeds immutable fixture data and exposes detached snapshots", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  const before = structuredClone(data);
  harness();
  const api = initEmulator(data, {});
  const runtime = api.getRuntimeSnapshot();
  assert.equal(runtime.enabled, true);
  assert.equal(runtime.adapter.capacity, 768);
  assert.equal(runtime.adapter.playerInventory.length, 36);
  assert.equal(runtime.projection.slots.length, 18);
  assert.deepEqual(data, before);
  const detached = api.getRuntimeSnapshot();
  detached.adapter.storage[0] = null;
  assert.notEqual(api.getRuntimeSnapshot().adapter.storage[0], null);
  const trace = api.getTrace();
  assert.deepEqual(trace, api.getTrace());
  cleanup();
});

test("logical dispatch supports hover, left/right, middle and shift flows", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  harness();
  const api = initEmulator(data, {});
  assert.equal(api.dispatchInput({ type: "pointermove", x: 249, y: 43 }).reason, "hover");
  assert.equal(api.getSnapshot().runtime.adapter.carried, null);
  const down = api.dispatchInput({ type: "pointerdown", x: 249, y: 43 });
  const up = api.dispatchInput({ type: "pointerup", x: 249, y: 43 });
  assert.equal(down.target.displayIndex, 0);
  assert.equal(up.accepted, true);
  assert.ok(api.getRuntimeSnapshot().adapter.carried);
  const revision = api.getRuntimeSnapshot().menu.revision;
  api.dispatchInput({ type: "pointerdown", x: 249, y: 43 });
  api.dispatchInput({ type: "pointerup", x: 249, y: 43 });
  assert.ok(api.getRuntimeSnapshot().menu.revision > revision);
  const reset = api.resetRuntime();
  assert.equal(reset.adapter.carried, null);
  cleanup();
});

test("screens without the exact adapter remain read-only", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/currency-stash.json", import.meta.url), "utf8"));
  harness("?screen=currency_stash");
  const api = initEmulator(data, {});
  assert.equal(api.getRuntimeSnapshot().enabled, false);
  assert.equal(api.dispatchInput({ type: "pointerup", x: 249, y: 43 }).reason, "read-only");
  cleanup();
});

test("runtime projection, view traffic, and fixture seeds stay authoritative", () => {
  const source = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  for (const fixture of ["normal", "empty", "many", "other"]) {
    const data = structuredClone(source);
    const before = structuredClone(data);
    harness();
    const api = initEmulator(data, {});
    api.setState({ fixture });
    const initial = api.getSnapshot();
    assert.equal(initial.runtime.enabled, true);
    assert.equal(initial.fixture.itemCount, fixture === "normal" ? 18 : fixture === "empty" ? 0 : fixture === "many" ? 108 : 6);
    const seeded = api.getRuntimeSnapshot();
    assert.equal(seeded.requestId, 0);
    assert.deepEqual(api.getTrace(), { version: 1, inputs: [], transport: { version: 1, entries: [], finalTick: 0, queue: [] } });
    api.dispatchInput({ type: "pointermove", x: 249, y: 43 });
    const changed = api.getSnapshot();
    assert.equal(JSON.stringify(changed), JSON.stringify(JSON.parse(globalThis.document.getElementById("inspector-state").textContent)));
    assert.deepEqual(data, before);
    api.resetRuntime();
    assert.equal(api.getRuntimeSnapshot().requestId, 0);
    assert.deepEqual(api.getTrace().inputs, []);
    assert.deepEqual(data, before);
    cleanup();
  }
});

test("only exact map interaction contracts enable runtime", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  for (const interaction of [{ adapter: "unknown" }, { kind: "container", adapter: "cte2-map-stash", storage: { capacity: 768 } }]) {
    const project = structuredClone(DEFAULT_CTE2_PROJECT);
    project.screens.find((screen) => screen.id === "map_stash").interaction = interaction;
    harness();
    const api = initEmulator(data, { project });
    assert.equal(api.getRuntimeSnapshot().enabled, false);
    const result = api.dispatchInput({ type: "pointerup", x: 249, y: 43 });
    assert.equal(result.reason, "read-only");
    cleanup();
  }
});

test("pointer operations preserve authority, trace inputs, hover semantics, and reset state", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  harness();
  const api = initEmulator(data, {});
  const root = globalThis.document.getElementById("forge-ui-emulator");
  const preview = globalThis.document.getElementById("map-stash-preview");
  const initialRevision = api.getRuntimeSnapshot().menu.revision;
  api.setState({ locale: "en", scroll: 2, width: 800, height: 500, state: "full" });
  assert.equal(api.getRuntimeSnapshot().requestId, 0);
  assert.equal(api.getTrace().transport.entries.length, 0);
  api.dispatchInput({ type: "pointermove", x: 249, y: 43 });
  assert.equal(root.dataset.runtimeHoverIndex, "0");
  assert.equal(globalThis.document.getElementById("stash-grid").children[0].className.includes("runtime-hovered"), true);
  assert.equal(preview.querySelector("#runtime-tooltip")?.getAttribute("role"), "tooltip");
  const hoveredSlot = globalThis.document.getElementById("stash-grid").children[0];
  api.dispatchInput({ type: "pointermove", x: 250, y: 44 });
  assert.equal(globalThis.document.getElementById("stash-grid").children[0], hoveredSlot);
  api.dispatchInput({ type: "pointermove", x: 0, y: 0 });
  assert.equal(root.dataset.runtimeHoverIndex, "");
  const slotBeforeDown = globalThis.document.getElementById("stash-grid").children[0];
  api.dispatchInput({ type: "pointerdown", x: 249, y: 43 });
  assert.equal(globalThis.document.getElementById("stash-grid").children[0], slotBeforeDown);
  assert.deepEqual(api.getSnapshot(), JSON.parse(globalThis.document.getElementById("inspector-state").textContent));
  const left = api.dispatchInput({ type: "pointerup", x: 249, y: 43 });
  assert.equal(left.accepted, true);
  assert.equal(api.getRuntimeSnapshot().adapter.carried.count, 1);
  const afterPickup = api.getSnapshot();
  assert.equal(afterPickup.fixture.itemCount, 17);
  assert.deepEqual(afterPickup, JSON.parse(globalThis.document.getElementById("inspector-state").textContent));
  api.dispatchInput({ type: "pointerdown", x: 339, y: 52 });
  api.dispatchInput({ type: "pointerup", x: 339, y: 52 });
  assert.equal(api.getRuntimeSnapshot().adapter.carried, null);
  const requestCountBeforeView = api.getTrace().transport.entries.length;
  api.setState({ layout: "layout_01", page: 0 });
  assert.equal(api.getTrace().transport.entries.length, requestCountBeforeView + 1);
  assert.ok(api.getRuntimeSnapshot().menu.revision >= initialRevision);
  const detached = api.getTrace(); detached.inputs.push({});
  assert.notEqual(api.getTrace().inputs.length, detached.inputs.length);
  const down = api.dispatchInput({ type: "pointerdown", x: 249, y: 43 });
  const beforeReject = JSON.stringify(api.getRuntimeSnapshot().adapter);
  const rejected = api.dispatchInput({ type: "pointerup", x: 267, y: 43 });
  assert.equal(down.target.displayIndex, 0);
  assert.equal(rejected.accepted, false);
  assert.equal(JSON.stringify(api.getRuntimeSnapshot().adapter), beforeReject);
  assert.deepEqual(api.getSnapshot(), JSON.parse(globalThis.document.getElementById("inspector-state").textContent));
  const context = preview.dispatch("contextmenu");
  assert.equal(context.defaultPrevented, true);
  const logical = { x: 249, y: 43 };
  preview.dispatch("pointerdown", { clientX: logical.x * 960 / 474, clientY: logical.y * 540 / 326, button: 0, buttons: 1 });
  const domUp = preview.dispatch("pointerup", { clientX: logical.x * 960 / 474, clientY: logical.y * 540 / 326, button: 0, buttons: 0 });
  assert.equal(domUp.defaultPrevented, false);
  preview.dispatch("keydown", { key: "Shift", shiftKey: true });
  assert.deepEqual(api.getSnapshot(), JSON.parse(globalThis.document.getElementById("inspector-state").textContent));
  preview.dispatch("keyup", { key: "Shift", shiftKey: false });
  assert.equal(api.getTrace().inputs.at(-1).input.type, "keyup");
  api.resetRuntime();
  assert.equal(api.getRuntimeSnapshot().menu.revision, 0);
  assert.deepEqual(api.getTrace().inputs, []);
  assert.deepEqual(api.getRuntimeSnapshot().input, { pointerDownTarget: null, hoverTarget: null, pointer: { x: 0, y: 0 } });
  cleanup();
});

test("right, middle, Shift transfer, and manifest inventory mappings are real operations", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  harness();
  const api = initEmulator(data, {});
  const rightPoint = { x: 267, y: 43 };
  api.dispatchInput({ type: "pointerdown", ...rightPoint, button: 2 });
  const half = api.dispatchInput({ type: "pointerup", ...rightPoint, button: 2 });
  assert.equal(half.accepted, true);
  assert.equal(api.getRuntimeSnapshot().adapter.carried.count, 1);
  api.dispatchInput({ type: "pointerdown", ...rightPoint, button: 2 });
  api.dispatchInput({ type: "pointerup", ...rightPoint, button: 2 });
  assert.equal(api.getRuntimeSnapshot().adapter.carried, null);
  const organize = api.dispatchInput({ type: "pointerdown", x: 249, y: 43, button: 1 });
  const organized = api.dispatchInput({ type: "pointerup", x: 249, y: 43, button: 1 });
  assert.equal(organize.target.kind, "stash");
  assert.ok(["ok", "no_change"].includes(organized.response?.result?.reason ?? organized.reason));
  const beforeShift = api.getRuntimeSnapshot().adapter;
  api.dispatchInput({ type: "pointerdown", x: 249, y: 43, shiftKey: true });
  const movedToPlayer = api.dispatchInput({ type: "pointerup", x: 249, y: 43, shiftKey: true });
  assert.equal(movedToPlayer.accepted, true);
  assert.ok(api.getRuntimeSnapshot().adapter.playerInventory[8]);
  assert.equal(api.getRuntimeSnapshot().adapter.storage[0], null);
  const hotbar = api.dispatchInput({ type: "pointerdown", x: 267 + 8 * 18 + 9, y: 290 + 9, shiftKey: true });
  assert.equal(hotbar.target.inventoryIndex, 8);
  api.dispatchInput({ type: "pointerup", x: 267 + 8 * 18 + 9, y: 290 + 9, shiftKey: true });
  assert.equal(api.getRuntimeSnapshot().adapter.playerInventory[8], null);
  assert.ok(api.getRuntimeSnapshot().adapter.storage[0] || beforeShift.storage[0]);
  api.dispatchInput({ type: "pointermove", x: 267 + 8 * 18 + 9, y: 290 + 9 });
  const root = globalThis.document.getElementById("forge-ui-emulator");
  assert.equal(root.dataset.runtimeHoverTarget, "player");
  assert.equal(root.dataset.runtimeHoverIndex, "8");
  const main = api.dispatchInput({ type: "pointerdown", x: 267 + 9, y: 228 + 9 });
  assert.equal(main.target.inventoryIndex, 9);
  cleanup();
});

test("stash DOM physical indices come from authoritative projection after organize", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  const nodes = harness();
  const api = initEmulator(data, {});
  const embeddedByItemBefore = Object.fromEntries(api.getRuntimeSnapshot().adapter.storage.filter(Boolean).map((stack) => [stack.itemId, stack.components.forge_ui_inspector.physicalIndex]));
  api.dispatchInput({ type: "pointerdown", x: 249, y: 43, button: 1 });
  const organized = api.dispatchInput({ type: "pointerup", x: 249, y: 43, button: 1 });
  assert.equal(organized.accepted, true);
  const runtime = api.getRuntimeSnapshot();
  const mismatch = runtime.projection.slots.findIndex((stack, index) => stack.components.forge_ui_inspector.physicalIndex !== runtime.projection.physicalIndices[index]);
  assert.notEqual(mismatch, -1);
  assert.equal(nodes.get("stash-grid").children[mismatch].dataset.physicalIndex, String(runtime.projection.physicalIndices[mismatch]));
  const embeddedByItemAfter = Object.fromEntries(runtime.adapter.storage.filter(Boolean).map((stack) => [stack.itemId, stack.components.forge_ui_inspector.physicalIndex]));
  assert.deepEqual(embeddedByItemAfter, embeddedByItemBefore);
  cleanup();
});

test("authoritative page clamps after a mutation crosses the 97-to-96 boundary", () => {
  const source = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  const data = structuredClone(source);
  const many = data.fixtures.find((fixture) => fixture.id === "many");
  many.items = many.items.slice(0, 97);
  const nodes = harness("?fixture=many&page=1");
  const api = initEmulator(data, {});
  assert.equal(api.getState().page, 1);
  assert.equal(api.getRuntimeSnapshot().projection.page, 1);
  api.dispatchInput({ type: "pointerdown", x: 249, y: 43, shiftKey: true });
  const moved = api.dispatchInput({ type: "pointerup", x: 249, y: 43, shiftKey: true });
  assert.equal(moved.accepted, true);
  assert.equal(api.getRuntimeSnapshot().projection.matchCount, 96);
  assert.equal(api.getRuntimeSnapshot().projection.page, 0);
  assert.equal(api.getState().page, 0);
  assert.equal(api.getSnapshot().state.page, 0);
  assert.match(api.getCanonicalUrl(), /[?&]page=0(?:&|$)/);
  assert.deepEqual(api.getSnapshot(), JSON.parse(nodes.get("inspector-state").textContent));
  cleanup();
});

test("DOM client coordinates remain equivalent at both viewport sizes", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8"));
  harness();
  const api = initEmulator(data, {});
  const preview = globalThis.document.getElementById("map-stash-preview");
  for (const [width, height] of [[960, 540], [1280, 720]]) {
    api.resetRuntime();
    preview.rect = { left: 0, top: 0, width, height };
    const x = 249 * width / 474;
    const y = 43 * height / 326;
    preview.dispatch("pointerdown", { clientX: x, clientY: y, button: 0, buttons: 1 });
    const up = preview.dispatch("pointerup", { clientX: x, clientY: y, button: 0, buttons: 0 });
    assert.equal(up.defaultPrevented, false);
    assert.equal(api.getRuntimeSnapshot().adapter.carried.components.map_stash.layout, "layout_01");
  }
  cleanup();
});
