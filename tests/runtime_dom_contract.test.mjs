import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DEFAULT_CTE2_PROJECT, RARITY_IDS, initEmulator } from "../emulator/emulator.js";

class HarnessElement {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase(); this.children = []; this.parentNode = null; this.dataset = {}; this.listeners = {}; this.attributes = {}; this.className = "";
    this.style = { setProperty: (key, value) => { this.style[key] = value; } };
    const classes = () => this.className.split(/\s+/).filter(Boolean);
    this.classList = {
      add: (...names) => { this.className = [...new Set([...classes(), ...names])].join(" "); },
      remove: (...names) => { this.className = classes().filter((name) => !names.includes(name)).join(" "); },
      contains: (name) => classes().includes(name),
      toggle: (name, force) => { const enabled = force === undefined ? !classes().includes(name) : Boolean(force); if (enabled) this.classList.add(name); else this.classList.remove(name); return enabled; },
    };
  }
  append(...children) { for (const child of children.flat()) { if (child == null) continue; child.parentNode = this; this.children.push(child); } }
  replaceChildren(...children) { for (const child of this.children) if (child?.parentNode === this) child.parentNode = null; this.children = []; this.append(...children); }
  add(option) { this.append(option); }
  addEventListener(type, handler) { (this.listeners[type] ??= []).push(handler); }
  dispatch(type, detail = {}) {
    const event = { type, target: this, currentTarget: this, bubbles: detail.bubbles ?? true, defaultPrevented: false, propagationStopped: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.propagationStopped = true; }, ...detail };
    let node = this;
    while (node) { event.currentTarget = node; for (const handler of node.listeners[type] ?? []) handler(event); if (!event.bubbles || event.propagationStopped) break; node = node.parentNode; }
    return event;
  }
  dispatchEvent(event) { return !this.dispatch(event.type, event).defaultPrevented; }
  setAttribute(name, value) { const text = String(value); this.attributes[name] = text; this[name] = text; if (name.startsWith("data-")) this.dataset[name.slice(5).replaceAll(/-([a-z])/g, (_m, c) => c.toUpperCase())] = text; }
  getAttribute(name) { return this.attributes[name] ?? this[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; delete this[name]; }
  toggleAttribute(name, force) { if (force === false) this.removeAttribute(name); else this.setAttribute(name, ""); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((child) => child !== this); this.parentNode = null; }
  getContext() { return { measureText: (value) => ({ width: String(value).length * 6 }) }; }
  getBoundingClientRect() { return this.rect ?? { left: 0, top: 0, width: 474, height: 326 }; }
  matches(selector) {
    if (selector.startsWith("#")) return this.id === selector.slice(1);
    if (selector.startsWith(".")) return this.classList.contains(selector.slice(1));
    const testId = selector.match(/^\[data-testid="([^"]+)"\]$/); if (testId) return this.dataset.testid === testId[1];
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }
  querySelector(selector) { for (const child of this.children) { if (child?.matches?.(selector)) return child; const nested = child?.querySelector?.(selector); if (nested) return nested; } return null; }
}

function harness(search = "") {
  const ids = ["forge-ui-emulator", "fixture-control", "project-control", "screen-control", "master-variant-control", "master-variant-control-wrap", "locale-control", "layout-control", "page-control", "scroll-control", "state-control", "width-control", "height-control", "scale-control", "map-stash-preview", "master-stash-preview", "extended-preview", "layout-list", "stash-grid", "stash-page", "stash-page-previous", "stash-page-next", "rarity-filter", "player-inventory", "inspector-state", "canonical", "alignment-badge", "title", "state", "selected-layout", "reset", "reload-assets", "copy"];
  const nodes = new Map(ids.map((id) => { const node = new HarnessElement(id === "inspector-state" ? "output" : "div"); node.id = id; return [id, node]; }));
  const preview = nodes.get("map-stash-preview");
  preview.rect = { left: 0, top: 0, width: 960, height: 540 };
  preview.append(nodes.get("title"), nodes.get("state"), nodes.get("rarity-filter"), nodes.get("layout-list"), nodes.get("selected-layout"), nodes.get("stash-grid"), nodes.get("stash-page-previous"), nodes.get("stash-page-next"), nodes.get("stash-page"), nodes.get("player-inventory"));
  const wrap = new HarnessElement("div"); wrap.append(preview);
  globalThis.Option = class Option { constructor(text, value) { this.text = text; this.value = value; this.parentNode = null; } };
  globalThis.document = { getElementById: (id) => nodes.get(id) ?? null, createElement: (tag) => new HarnessElement(tag), body: new HarnessElement("body"), documentElement: {}, querySelector: (selector) => selector === ".preview-wrap" ? wrap : null };
  globalThis.window = { innerWidth: 1280, innerHeight: 720, location: { href: `index.html${search}`, search, assign(url) { this.href = String(url); } }, history: { replaceState: (_a, _b, url) => { window.location.href = url; window.location.search = url.includes("?") ? url.slice(url.indexOf("?")) : ""; } }, addEventListener() {} };
  globalThis.history = window.history;
  return nodes;
}

function cleanup() { delete globalThis.document; delete globalThis.window; delete globalThis.history; delete globalThis.Option; }
function mapData() { return JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/map-stash.json", import.meta.url), "utf8")); }
function currencyData() { return JSON.parse(fs.readFileSync(new URL("../emulator/fixtures/currency-stash.json", import.meta.url), "utf8")); }
function stashPoint(displayIndex = 0) { return { x: 240 + (displayIndex % 12) * 18 + 9, y: 34 + Math.floor(displayIndex / 12) * 18 + 9 }; }
function playerPoint(inventoryIndex) { if (inventoryIndex < 9) return { x: 267 + inventoryIndex * 18 + 9, y: 299 }; const visual = inventoryIndex - 9; return { x: 267 + (visual % 9) * 18 + 9, y: 228 + Math.floor(visual / 9) * 18 + 9 }; }
function gesture(api, point, options = {}) { api.dispatchInput({ type: "pointerdown", ...point, ...options }); return api.dispatchInput({ type: "pointerup", ...point, ...options }); }
function browserPointerActivation(target, preview, point) { const clientX = preview.rect.left + point.x * preview.rect.width / 474; const clientY = preview.rect.top + point.y * preview.rect.height / 326; target.dispatch("pointerdown", { clientX, clientY, button: 0, buttons: 1 }); target.dispatch("pointerup", { clientX, clientY, button: 0, buttons: 0 }); target.dispatch("click", { detail: 1, button: 0 }); }
function parsedMachine(nodes) { return JSON.parse(nodes.get("inspector-state").textContent); }
function authoritative(api) { const value = api.getRuntimeSnapshot(); return { adapter: value.adapter, revision: value.menu.revision }; }

test("all fixture seeds are immutable, canonical, detached, and expose lightweight machine state", () => {
  const data = mapData(); const before = structuredClone(data);
  for (const [fixture, expected] of Object.entries({ normal: 18, empty: 0, many: 108, other: 6 })) {
    const nodes = harness(); const api = initEmulator(data, {}); api.setState({ fixture });
    const diagnostic = api.getRuntimeSnapshot(); const machine = api.getSnapshot().runtime;
    assert.equal(diagnostic.enabled, true); assert.equal(diagnostic.adapter.storage.length, 768); assert.equal(diagnostic.adapter.playerInventory.length, 36); assert.equal(diagnostic.projection.matchCount, expected);
    assert.equal(machine.adapter, undefined); assert.equal(machine.trace, undefined); assert.equal(machine.transport.entries, undefined); assert.equal(machine.projection.physicalIndices.length, Math.min(expected, 96));
    assert.deepEqual(api.getSnapshot(), parsedMachine(nodes));
    for (const stack of diagnostic.adapter.storage.filter(Boolean)) { assert.equal(stack.components?.forge_ui_inspector, undefined); assert.equal(stack.components?.map_stash, undefined); assert.equal(stack.tag?.forge_ui_inspector, undefined); assert.equal(stack.tag?.map_stash, undefined); }
    const detachedDiagnostic = api.getRuntimeSnapshot(); detachedDiagnostic.input.pointer.x = 999; assert.notDeepEqual(detachedDiagnostic, api.getRuntimeSnapshot());
    const detachedTrace = api.getTrace(); detachedTrace.inputs.push({}); assert.notDeepEqual(detachedTrace, api.getTrace());
    api.resetRuntime(); assert.deepEqual(data, before); cleanup();
  }
});

test("render and classification sidecars follow canonical stack identity rather than item id", () => {
  const data = mapData(); const fixture = data.fixtures.find(({ id }) => id === "normal");
  fixture.items = [
    { itemId: "cte2:shared_map", page: 0, slot: 0, icon: "map", label: "Opaque A", count: 2, layout: "layout_01", rarity: "common", tag: { variant: "a" }, components: { opaque: { seed: 1 } } },
    { itemId: "cte2:shared_map", page: 0, slot: 1, icon: "paper", label: "Opaque B", count: 1, layout: "layout_02", rarity: "rare", tag: { variant: "b" }, components: { opaque: { seed: 2 } } },
  ];
  const nodes = harness(); const api = initEmulator(data, {}); let grid = nodes.get("stash-grid");
  assert.equal(api.getRuntimeSnapshot().projection.matchCount, 2);
  assert.equal(grid.children[0].title, "Opaque A"); assert.equal(grid.children[0].children[0].className, "icon-map");
  assert.equal(grid.children[1].title, "Opaque B"); assert.equal(grid.children[1].children[0].className, "icon-paper");
  api.setState({ layout: "layout_02", rarity: "rare" }); grid = nodes.get("stash-grid");
  assert.deepEqual(api.getRuntimeSnapshot().projection.physicalIndices, [1]); assert.equal(grid.children[0].title, "Opaque B");
  gesture(api, stashPoint(0)); assert.equal(nodes.get("map-stash-preview").querySelector(".runtime-carried").getAttribute("aria-label"), "Opaque B ×1");
  cleanup();

  const conflicting = mapData(); const conflictingFixture = conflicting.fixtures.find(({ id }) => id === "normal");
  conflictingFixture.items = [
    { itemId: "cte2:conflict", page: 0, slot: 0, icon: "map", count: 1, layout: "layout_01", rarity: "common", tag: { same: true }, components: { same: true } },
    { itemId: "cte2:conflict", page: 0, slot: 1, icon: "paper", count: 3, layout: "layout_02", rarity: "rare", tag: { same: true }, components: { same: true } },
  ];
  harness(); assert.throws(() => initEmulator(conflicting, {}), /conflicting render sidecar/); cleanup();
});

test("only the complete known interaction contract enables mutation", () => {
  const known = structuredClone(DEFAULT_CTE2_PROJECT.screens.find((screen) => screen.id === "map_stash").interaction);
  const cases = [
    { data: currencyData(), search: "?screen=currency_stash", project: DEFAULT_CTE2_PROJECT },
    { data: mapData(), search: "", interaction: { kind: "container", adapter: "unknown" } },
    { data: mapData(), search: "", interaction: { kind: "container", adapter: "cte2-map-stash", storage: { capacity: 768 }, projection: { kind: "filtered-physical", pageSize: 95 }, playerInventory: { slots: 36 } } },
    { data: mapData(), search: "", interaction: { ...known, rarityWidget: undefined } },
    { data: mapData(), search: "", interaction: { ...known, rarityWidget: { x: Number.NaN, y: 6, width: 106, height: 18 } } },
    { data: mapData(), search: "", interaction: { ...known, rarityWidget: { x: 112, y: Number.POSITIVE_INFINITY, width: 106, height: 18 } } },
    { data: mapData(), search: "", interaction: { ...known, rarityWidget: { x: 112, y: 6, width: 0, height: 18 } } },
    { data: mapData(), search: "", interaction: { ...known, rarityWidget: { x: 112, y: 6, width: 106, height: -1 } } },
  ];
  for (const candidate of cases) {
    const project = structuredClone(candidate.project ?? DEFAULT_CTE2_PROJECT); if (candidate.interaction) project.screens.find((screen) => screen.id === "map_stash").interaction = candidate.interaction;
    harness(candidate.search); const api = initEmulator(candidate.data, { project });
    assert.equal(api.getRuntimeSnapshot().enabled, false); const result = api.dispatchInput({ type: "pointerup", ...stashPoint() }); assert.equal(result.reason, "read-only"); result.input.x = 999; assert.notEqual(api.dispatchInput({ type: "pointerup", ...stashPoint() }).input.x, 999); cleanup();
  }
});

test("hover, tooltip, carried status, outside leave, and player indices stay synchronized", () => {
  const nodes = harness(); const api = initEmulator(mapData(), {}); const root = nodes.get("forge-ui-emulator"); const preview = nodes.get("map-stash-preview");
  api.dispatchInput({ type: "pointermove", ...stashPoint(0) });
  assert.equal(nodes.get("stash-grid").children[0].classList.contains("runtime-hovered"), true); assert.equal(preview.querySelector("#runtime-tooltip").getAttribute("role"), "tooltip"); assert.equal(nodes.get("stash-grid").children[0].getAttribute("aria-describedby"), "runtime-tooltip");
  assert.equal(root.dataset.runtimeHoverTarget, "stash"); assert.equal(root.dataset.runtimeHoverIndex, "0"); assert.equal(preview.querySelector("#runtime-tooltip").style.left, "261px");
  gesture(api, stashPoint(0)); assert.ok(api.getRuntimeSnapshot().adapter.carried); assert.equal(preview.querySelector(".runtime-carried").getAttribute("role"), "status"); assert.equal(preview.querySelector(".runtime-carried").hidden, false);
  api.dispatchInput({ type: "pointermove", ...playerPoint(8) }); assert.equal(root.dataset.runtimeHoverTarget, "player"); assert.equal(root.dataset.runtimeHoverIndex, "8"); assert.equal(nodes.get("player-inventory").children[2].children[8].classList.contains("runtime-hovered"), true); assert.equal(nodes.get("player-inventory").children[2].children[8].getAttribute("aria-describedby"), "runtime-tooltip");
  api.dispatchInput({ type: "pointermove", x: 0, y: 0 }); assert.equal(root.dataset.runtimeHoverIndex, ""); assert.equal(preview.querySelector("#runtime-tooltip").hidden, true);
  preview.dispatch("keydown", { key: "Enter", shiftKey: true, ctrlKey: true, altKey: true, metaKey: true }); preview.dispatch("keyup", { key: "Enter" });
  const [keyDown, keyUp] = api.getTrace().inputs.slice(-2).map(({ input }) => input); assert.equal(keyDown.type, "keydown"); assert.equal(keyDown.shiftKey, true); assert.equal(keyDown.ctrlKey, true); assert.equal(keyDown.altKey, true); assert.equal(keyDown.metaKey, true); assert.equal(keyUp.type, "keyup");
  cleanup();
});

test("normal left/right cursor operations merge, swap, and move across player and stash", () => {
  const data = mapData(); const fixture = data.fixtures.find(({ id }) => id === "normal");
  fixture.items = [
    { itemId: "cte2:a", page: 0, slot: 0, icon: "map", count: 8, layout: "layout_01", rarity: "common" },
    { itemId: "cte2:a", page: 0, slot: 1, icon: "map", count: 4, layout: "layout_01", rarity: "common" },
    { itemId: "cte2:b", page: 0, slot: 2, icon: "paper", count: 3, layout: "layout_01", rarity: "common", tag: { opaque: 1 } },
  ];
  harness(); const api = initEmulator(data, {});
  gesture(api, stashPoint(0), { button: 2 }); assert.equal(api.getRuntimeSnapshot().adapter.carried.count, 4); assert.equal(api.getRuntimeSnapshot().adapter.storage[0].count, 4);
  gesture(api, playerPoint(9), { button: 2 }); gesture(api, playerPoint(9), { button: 2 }); let state = api.getRuntimeSnapshot().adapter; assert.equal(state.playerInventory[9].count, 2); assert.equal(state.carried.count, 2);
  gesture(api, playerPoint(10)); assert.equal(api.getRuntimeSnapshot().adapter.carried, null); assert.equal(api.getRuntimeSnapshot().adapter.playerInventory[10].count, 2);
  gesture(api, stashPoint(0)); gesture(api, playerPoint(9)); state = api.getRuntimeSnapshot().adapter; assert.equal(state.playerInventory[9].count, 6); assert.equal(state.carried, null);
  gesture(api, stashPoint(1)); gesture(api, playerPoint(9)); state = api.getRuntimeSnapshot().adapter; assert.equal(state.playerInventory[9].itemId, "cte2:b"); assert.deepEqual(state.playerInventory[9].tag, { opaque: 1 }); assert.equal(state.carried.itemId, "cte2:a");
  gesture(api, stashPoint(1)); state = api.getRuntimeSnapshot().adapter; assert.equal(state.carried, null); assert.equal(state.storage[1].itemId, "cte2:a");
  assert.equal(state.storage[0].count + state.storage[1].count + state.playerInventory[10].count, 12); cleanup();
});

test("middle organize, Shift transfer, hotbar/main mapping, and projection physical indices are authoritative", () => {
  const data = mapData(); const fixture = data.fixtures.find(({ id }) => id === "normal");
  fixture.items = [
    { itemId: "cte2:z", page: 0, slot: 0, icon: "map", count: 1, layout: "layout_01", rarity: "common", components: { opaque: { n: 1 } } },
    { itemId: "cte2:a", page: 0, slot: 1, icon: "paper", count: 1, layout: "layout_01", rarity: "common", components: { opaque: { n: 2 } } },
  ];
  const nodes = harness(); const api = initEmulator(data, {}); const before = structuredClone(data);
  const organized = gesture(api, stashPoint(0), { button: 1 }); assert.equal(organized.accepted, true); let runtime = api.getRuntimeSnapshot(); assert.equal(runtime.projection.slots[0].itemId, "cte2:a"); assert.equal(nodes.get("stash-grid").children[0].dataset.physicalIndex, "0"); assert.deepEqual(runtime.projection.slots[0].components, { opaque: { n: 2 } });
  const moved = gesture(api, stashPoint(0), { shiftKey: true }); assert.equal(moved.accepted, true); runtime = api.getRuntimeSnapshot(); assert.equal(runtime.adapter.playerInventory[8].itemId, "cte2:a"); assert.equal(runtime.projection.matchCount, 1);
  assert.equal(gesture(api, playerPoint(8), { shiftKey: true }).accepted, true); runtime = api.getRuntimeSnapshot(); assert.equal(runtime.adapter.playerInventory[8], null); assert.equal(runtime.projection.matchCount, 2);
  gesture(api, stashPoint(0)); gesture(api, playerPoint(9)); assert.equal(api.getRuntimeSnapshot().adapter.playerInventory[9].itemId, "cte2:a"); assert.equal(gesture(api, playerPoint(9), { shiftKey: true }).accepted, true); assert.equal(api.getRuntimeSnapshot().adapter.playerInventory[9], null);
  assert.deepEqual(data, before); api.resetRuntime(); assert.deepEqual(data, before); cleanup();
});

test("rarity widget matches production cycle order, clamps page, filters counts, and localizes", () => {
  const nodes = harness("?fixture=many&page=1"); const api = initEmulator(mapData(), {}); const rarity = nodes.get("rarity-filter");
  assert.equal(api.getState().page, 1); assert.equal(nodes.get("map-stash-preview").style["--rarity-x"], "112px"); assert.equal(nodes.get("map-stash-preview").style["--rarity-y"], "6px"); assert.equal(nodes.get("map-stash-preview").style["--rarity-width"], "106px"); assert.equal(nodes.get("map-stash-preview").style["--rarity-height"], "18px");
  const preview = nodes.get("map-stash-preview"); const logical = stashPoint(0); const wheel = nodes.get("stash-grid").dispatch("wheel", { clientX: logical.x * preview.rect.width / 474, clientY: logical.y * preview.rect.height / 326, deltaY: -18 }); assert.equal(wheel.defaultPrevented, true); assert.equal(api.getState().page, 0); api.setState({ page: 1 });
  const startTraffic = api.getTrace().transport.entries.length; rarity.dispatch("click"); assert.equal(api.getState().rarity, "common"); assert.equal(api.getState().page, 0); assert.equal(api.getSnapshot().fixture.itemCount, 1); assert.equal(api.getSnapshot().fixture.pageCount, 1); assert.equal(api.getTrace().transport.entries.length, startTraffic + 1); assert.match(api.getCanonicalUrl(), /rarity=common/);
  const observed = [api.getState().rarity]; for (let index = 0; index < RARITY_IDS.length - 1; index += 1) { rarity.dispatch("click"); observed.push(api.getState().rarity); }
  assert.deepEqual(observed, ["common", "uncommon", "rare", "epic", "legendary", "mythic", "unique", "other", "all"]); assert.match(rarity.textContent, /レアリティ/);
  const traffic = api.getTrace().transport.entries.length; api.setState({ locale: "en" }); assert.equal(api.getTrace().transport.entries.length, traffic); assert.match(rarity.textContent, /Rarity/);
  api.reset(); assert.equal(api.getState().rarity, "all"); assert.equal(api.getRuntimeSnapshot().requestId, 0); cleanup();
});

test("browser pointer and keyboard activation dispatch exactly one runtime gesture per control", () => {
  const nodes = harness("?fixture=many&page=1&rarity=all"); const api = initEmulator(mapData(), {}); const preview = nodes.get("map-stash-preview"); const rarity = nodes.get("rarity-filter");
  let requests = api.getTrace().transport.entries.length; let requestId = api.getRuntimeSnapshot().requestId; let inputs = api.getTrace().inputs.length;
  browserPointerActivation(rarity, preview, { x: 165, y: 15 });
  assert.equal(api.getState().rarity, "common"); assert.equal(api.getState().page, 0); assert.equal(api.getTrace().transport.entries.length, requests + 1); assert.equal(api.getRuntimeSnapshot().requestId, requestId + 1); assert.equal(api.getTrace().inputs.length, inputs + 2);
  requests = api.getTrace().transport.entries.length; requestId = api.getRuntimeSnapshot().requestId; inputs = api.getTrace().inputs.length; rarity.dispatch("click", { detail: 0 });
  assert.equal(api.getState().rarity, "uncommon"); assert.equal(api.getTrace().transport.entries.length, requests + 1); assert.equal(api.getRuntimeSnapshot().requestId, requestId + 1); assert.equal(api.getTrace().inputs.length, inputs + 2);

  api.setState({ rarity: "all", layout: "all", page: 0 }); requests = api.getTrace().transport.entries.length; requestId = api.getRuntimeSnapshot().requestId;
  browserPointerActivation(nodes.get("stash-page-next"), preview, { x: 299, y: 187 });
  assert.equal(api.getState().page, 1); assert.equal(api.getTrace().transport.entries.length, requests + 1); assert.equal(api.getRuntimeSnapshot().requestId, requestId + 1);
  requests = api.getTrace().transport.entries.length; requestId = api.getRuntimeSnapshot().requestId; nodes.get("stash-page-previous").dispatch("click", { detail: 0 });
  assert.equal(api.getState().page, 0); assert.equal(api.getTrace().transport.entries.length, requests + 1); assert.equal(api.getRuntimeSnapshot().requestId, requestId + 1);

  const layoutRow = nodes.get("layout-list").children[1]; requests = api.getTrace().transport.entries.length; requestId = api.getRuntimeSnapshot().requestId;
  browserPointerActivation(layoutRow, preview, { x: 20, y: 61 });
  assert.equal(api.getState().layout, "layout_01"); assert.equal(api.getTrace().transport.entries.length, requests + 1); assert.equal(api.getRuntimeSnapshot().requestId, requestId + 1);
  const keyboardRow = nodes.get("layout-list").children[2]; requests = api.getTrace().transport.entries.length; requestId = api.getRuntimeSnapshot().requestId; keyboardRow.dispatch("click", { detail: 0 });
  assert.equal(api.getState().layout, "layout_02"); assert.equal(api.getTrace().transport.entries.length, requests + 1); assert.equal(api.getRuntimeSnapshot().requestId, requestId + 1); cleanup();
});

test("transport-backed view controls return the exact primary rejection or pending result", () => {
  const activate = (kind, nodes, api) => {
    const preview = nodes.get("map-stash-preview");
    if (kind === "rarity") browserPointerActivation(nodes.get("rarity-filter"), preview, { x: 165, y: 15 });
    else if (kind === "layout") browserPointerActivation(nodes.get("layout-list").children[1], preview, { x: 20, y: 61 });
    else if (kind === "page") browserPointerActivation(nodes.get("stash-page-next"), preview, { x: 299, y: 187 });
    else { const point = stashPoint(0); nodes.get("stash-grid").dispatch("wheel", { clientX: point.x * preview.rect.width / 474, clientY: point.y * preview.rect.height / 326, deltaY: 18 }); }
    return api.getTrace().inputs.at(-1).response;
  };
  const changed = { rarity: (api) => api.getState().rarity === "common", layout: (api) => api.getState().layout === "layout_01", page: (api) => api.getState().page === 1, wheel: (api) => api.getState().page === 1 };
  for (const kind of Object.keys(changed)) {
    const nodes = harness("?fixture=many"); const api = initEmulator(mapData(), { transportPolicy: { duplicate: () => 1, reorder: (ready) => [...ready].reverse() } }); const response = activate(kind, nodes, api);
    assert.equal(response.accepted, true, kind); assert.equal(response.reason, "ok", kind); assert.equal(response.requestId, 1, kind); assert.equal(response.sequence, 0, kind); assert.equal(response.pending, undefined, kind); assert.equal(changed[kind](api), true, kind); assert.deepEqual(api.getTrace().transport.entries.map(({ sequence }) => sequence), [1, 0], kind); cleanup();
  }
  for (const kind of Object.keys(changed)) {
    const nodes = harness("?fixture=many"); const api = initEmulator(mapData(), { transportPolicy: { delay: () => 2 } }); const response = activate(kind, nodes, api);
    assert.equal(response.accepted, false, kind); assert.equal(response.pending, true, kind); assert.equal(response.reason, "pending", kind); assert.equal(response.requestId, 1, kind); assert.equal(response.sequence, 0, kind); assert.equal(changed[kind](api), false, kind); assert.equal(api.getTrace().transport.entries.length, 0, kind); assert.equal(api.getTrace().transport.queue.length, 1, kind); cleanup();
  }
  const nodes = harness("?fixture=many"); const api = initEmulator(mapData(), { transportPolicy: { delay: () => 2 } }); const preview = nodes.get("map-stash-preview");
  const scrollEvent = nodes.get("layout-list").dispatch("wheel", { clientX: 20 * preview.rect.width / 474, clientY: 43 * preview.rect.height / 326, deltaY: 36 }); const scroll = api.getTrace().inputs.at(-1).response;
  assert.equal(scrollEvent.defaultPrevented, true); assert.equal(scroll.accepted, true); assert.equal(scroll.reason, "ok"); assert.equal(scroll.requestId, null); assert.equal(scroll.pending, undefined); assert.equal(api.getState().scroll, 2); assert.deepEqual(api.getTrace().transport.entries, []); cleanup();
});

test("layout, page, rarity, scroll, item, and player inputs replay deterministically", () => {
  const data = mapData(); const many = structuredClone(data.fixtures.find(({ id }) => id === "many")); many.id = "normal"; many.titleKey = data.fixtures[0].titleKey; data.fixtures[0] = many;
  const nodes = harness(); const api = initEmulator(data, {}); const inputs = [];
  const run = (input) => { inputs.push(structuredClone(input)); return api.dispatchInput(input); };
  const pair = (point, options = {}) => { run({ type: "pointerdown", ...point, ...options }); return run({ type: "pointerup", ...point, ...options }); };
  pair({ x: 299, y: 187 }); run({ type: "wheel", ...stashPoint(0), deltaY: -18 }); run({ type: "wheel", x: 20, y: 43, deltaY: 36 }); pair({ x: 20, y: 43 }); pair({ x: 165, y: 15 }); pair(stashPoint(0), { shiftKey: true }); pair(playerPoint(8)); pair(playerPoint(7));
  const expected = { canonical: api.getCanonicalUrl(), machine: api.getSnapshot(), diagnostic: api.getRuntimeSnapshot(), trace: api.getTrace() }; assert.deepEqual(expected.machine, parsedMachine(nodes));
  api.reset(); assert.deepEqual(api.getTrace().inputs, []); for (const input of inputs) api.dispatchInput(input);
  assert.equal(api.getCanonicalUrl(), expected.canonical); assert.deepEqual(api.getSnapshot(), expected.machine); assert.deepEqual(api.getRuntimeSnapshot(), expected.diagnostic); assert.deepEqual(api.getTrace(), expected.trace); cleanup();
});

test("non-view changes create no traffic and rejected gestures preserve authoritative bytes", () => {
  const nodes = harness(); const api = initEmulator(mapData(), {}); api.setState({ locale: "en", scroll: 2, width: 800, height: 500, state: "full" });
  assert.equal(api.getRuntimeSnapshot().requestId, 0); assert.deepEqual(api.getTrace().transport.entries, []);
  const before = authoritative(api); api.dispatchInput({ type: "pointerdown", ...stashPoint(0) }); const rejected = api.dispatchInput({ type: "pointerup", ...stashPoint(1) }); assert.equal(rejected.accepted, false); assert.deepEqual(authoritative(api), before); assert.deepEqual(api.getSnapshot(), parsedMachine(nodes));
  const context = nodes.get("map-stash-preview").dispatch("contextmenu"); assert.equal(context.defaultPrevented, true); cleanup();
});

test("duplicate, delay, and reorder policies preserve exact primary correlation", () => {
  {
    harness(); const api = initEmulator(mapData(), { transportPolicy: { duplicate: () => 1 } }); const result = gesture(api, stashPoint(0)); const entries = api.getTrace().transport.entries;
    assert.equal(result.accepted, true); assert.equal(entries.length, 2); assert.equal(entries[0].response.accepted, true); assert.equal(entries[1].response.accepted, true); cleanup();
  }
  {
    harness(); const api = initEmulator(mapData(), { transportPolicy: { delay: (request) => request.requestId === 1 ? 2 : 1 } }); const before = authoritative(api); const pending = gesture(api, stashPoint(0)); assert.equal(pending.pending, true); assert.deepEqual(authoritative(api), before);
    const second = gesture(api, stashPoint(1)); assert.equal(second.requestId, 2); assert.equal(second.reason, "stale"); assert.ok(api.getRuntimeSnapshot().adapter.carried); assert.equal(api.getTrace().transport.entries[0].request.requestId, 1); cleanup();
  }
  {
    harness(); const api = initEmulator(mapData(), { transportPolicy: { delay: (request) => request.requestId === 1 ? 2 : 1, reorder: (ready) => [...ready].reverse() } }); const first = gesture(api, stashPoint(0)); assert.equal(first.pending, true); const second = gesture(api, stashPoint(1));
    assert.equal(second.requestId, 2); assert.equal(second.accepted, true); assert.equal(api.getRuntimeSnapshot().adapter.carried.count, 2); assert.deepEqual(api.getTrace().transport.entries.map(({ request }) => request.requestId), [2, 1]); cleanup();
  }
});

test("a delayed view change makes an older display-index operation stale without touching either physical stack", () => {
  const data = mapData(); const fixture = data.fixtures.find(({ id }) => id === "normal");
  fixture.items = [
    { itemId: "cte2:old_view", page: 0, slot: 0, icon: "map", count: 1, layout: "layout_01", rarity: "rare", tag: { identity: "old" } },
    { itemId: "cte2:new_view", page: 0, slot: 1, icon: "paper", count: 1, layout: "layout_01", rarity: "common", tag: { identity: "new" } },
  ];
  const nodes = harness(); const api = initEmulator(data, { transportPolicy: { delay: (request) => request.requestId === 1 ? 2 : 1 } });
  const before = api.getRuntimeSnapshot().adapter;
  nodes.get("rarity-filter").dispatch("click");
  const pending = api.getTrace().inputs.at(-1).response; assert.equal(pending.pending, true); assert.equal(pending.requestId, 1);
  const stale = gesture(api, stashPoint(0)); const after = api.getRuntimeSnapshot();
  assert.equal(stale.requestId, 2); assert.equal(stale.reason, "stale_view"); assert.equal(stale.accepted, false);
  assert.equal(after.menu.viewGeneration, 1); assert.equal(after.adapter.rarity, "common"); assert.deepEqual(after.projection.physicalIndices, [1]);
  assert.deepEqual(after.adapter.storage, before.storage); assert.deepEqual(after.adapter.playerInventory, before.playerInventory); assert.equal(after.adapter.carried, null);
  assert.equal(after.adapter.storage[0].itemId, "cte2:old_view"); assert.equal(after.adapter.storage[1].itemId, "cte2:new_view");
  assert.deepEqual(api.getTrace().transport.entries.map(({ request }) => request.requestId), [1, 2]); cleanup();
});

test("runtime and full reset clear request/input/transport state and DOM viewport hits are equivalent", () => {
  const data = mapData(); const before = structuredClone(data); const nodes = harness(); const api = initEmulator(data, {}); const preview = nodes.get("map-stash-preview"); const fresh = api.getRuntimeSnapshot();
  gesture(api, stashPoint(0)); api.dispatchInput({ type: "pointermove", ...playerPoint(8) }); const reset = api.resetRuntime(); assert.deepEqual(reset, fresh); assert.deepEqual(api.getTrace(), { version: 1, inputs: [], transport: { version: 1, entries: [], finalTick: 0, queue: [] } }); assert.deepEqual(reset.input, { pointerDownTarget: null, hoverTarget: null, pointer: { x: 0, y: 0 } });
  for (const [width, height] of [[960, 540], [1280, 720]]) { api.resetRuntime(); preview.rect = { left: 17, top: 23, width, height }; const point = stashPoint(0); const clientX = 17 + point.x * width / 474; const clientY = 23 + point.y * height / 326; preview.dispatch("pointerdown", { clientX, clientY, button: 0, buttons: 1 }); preview.dispatch("pointerup", { clientX, clientY, button: 0, buttons: 0 }); assert.ok(api.getRuntimeSnapshot().adapter.carried); }
  api.setState({ fixture: "many", rarity: "rare" }); api.reset(); assert.equal(api.getState().fixture, "normal"); assert.equal(api.getState().rarity, "all"); assert.equal(api.getRuntimeSnapshot().requestId, 0); assert.deepEqual(data, before); cleanup();
});
