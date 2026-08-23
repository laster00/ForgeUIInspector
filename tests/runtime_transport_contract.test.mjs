import test from "node:test";
import assert from "node:assert/strict";
import { createMenuState } from "../emulator/runtime/menu.js";
import { createDeterministicTransport, replayTrace, stableTraceClone } from "../emulator/runtime/transport.js";
import { createMapStashAdapter } from "../emulator/runtime/adapters/map-stash.js";

function menu() {
  let value = 1;
  return createMenuState({
    menuId: "map",
    sessionId: "s",
    adapter: {
      click: () => ({ accepted: true, changed: true }),
      quickMove: () => ({ accepted: true, changed: true }),
      organize: () => ({ accepted: true, changed: false }),
      snapshot: () => ({ value }),
      restore: snapshot => { value = snapshot.value; return { value }; },
    },
  });
}
test("menu rejects stale and duplicate requests as no-op with correlated response", () => {
  const m = menu(); const request = { requestId: 1, menuId: "map", sessionId: "s", baseRevision: 0, operation: "organize", target: {}, modifiers: {} };
  assert.equal(m.handle(request).accepted, true); assert.equal(m.handle(request).reason, "duplicate"); assert.equal(m.handle({ ...request, requestId: 2, baseRevision: 1 }).reason, "stale");
});
test("deterministic transport trace is stable and supports delay/duplicate", () => {
  const run = () => { const t = createDeterministicTransport({ handler: x => ({ accepted: true, x }), delay: () => 1, duplicate: x => x.dup ?? 0 }); t.enqueue({ id: "a", dup: 1 }); t.drain(); return t.getTrace(); };
  assert.deepEqual(run(), run()); assert.deepEqual(stableTraceClone({ z: 1, a: [2] }), { a: [2], z: 1 });
});

test("transport validates bounded injection and reorder returns every ready entry exactly once", () => {
  for (const option of [{ delay: () => -1 }, { delay: () => Infinity }, { duplicate: () => 1.5 }]) { const t = createDeterministicTransport({ handler: x => x, ...option }); assert.throws(() => { t.enqueue({ id: 1 }); }); }
  const reordered = createDeterministicTransport({ handler: x => x, reorder: entries => entries.reverse() }); reordered.enqueue({ id: "a" }); reordered.enqueue({ id: "b" }); reordered.tick(); assert.deepEqual(reordered.getTrace().entries.map(entry => entry.request.id), ["b", "a"]);
  const broken = createDeterministicTransport({ handler: x => x, reorder: () => [] }); broken.enqueue({ id: 1 }); assert.throws(() => broken.tick(), /exactly once/);
});

test("queue, trace and replay snapshots are detached and replay preserves tick/order", () => {
  const run = () => { const t = createDeterministicTransport({ handler: request => ({ value: request.value }), delay: request => request.delay, duplicate: request => request.duplicates }); t.enqueue({ value: "a", delay: 0, duplicates: 0 }); t.enqueue({ value: "b", delay: 1, duplicates: 1 }); t.drain(); return t; };
  const original = run(); const trace = original.getTrace(); const snapshot = original.getSnapshot(); trace.entries[0].request.value = "mutated"; snapshot.queue.push({}); assert.equal(original.getTrace().entries[0].request.value, "a");
  const replayed = replayTrace(original.getTrace(), () => createDeterministicTransport({ handler: request => ({ value: request.value }), delay: request => request.delay, duplicate: request => request.duplicates })); assert.deepEqual(replayed.trace, original.getTrace()); assert.equal(replayed.snapshot.tick, original.getSnapshot().tick);
});

test("menu keeps carried server-side, authorizes setView, and consumes correlated rejected ids", () => {
  const adapter = createMapStashAdapterForMenu({ carried: { itemId: "cte2:server", count: 1, maxStackSize: 64, components: { map_stash: { layout: "other", rarity: "rare" } } } }); const m = createMenuState({ menuId: "map", sessionId: "session", adapter });
  const base = { menuId: "map", sessionId: "session", baseRevision: 0 };
  const view = m.handle({ ...base, requestId: 1, operation: "setView", target: { layout: "normal", rarity: "rare", page: 0 } }); assert.equal(view.accepted, true); assert.equal(view.snapshot.adapter.layout, "normal");
  const forged = m.handle({ ...base, requestId: 2, baseRevision: 0, operation: "place", target: { displayIndex: 0, carried: { itemId: "cte2:forged", count: 1, maxStackSize: 64 } }, modifiers: { button: 0 } }); assert.equal(forged.accepted, false); assert.equal(forged.reason, "filter"); assert.equal(forged.revision, 0);
  assert.equal(m.handle({ ...base, requestId: 2, operation: "setView" }).reason, "duplicate");
  assert.equal(m.handle({ ...base, requestId: 3, operation: "unsupported" }).reason, "unsupported"); assert.equal(m.handle({ ...base, requestId: 3, operation: "setView" }).reason, "duplicate");
  assert.equal(m.handle({ ...base, requestId: 4, baseRevision: 99, operation: "setView" }).reason, "stale"); assert.equal(m.handle({ ...base, requestId: 4, operation: "setView" }).reason, "duplicate");
});

test("menu rejects unknown configured filters, bounds/direction, and adapter exceptions without revision", () => {
  const adapter = createMapStashAdapterForMenu({ validLayouts: ["all", "normal"] }); const m = createMenuState({ menuId: "map", sessionId: "s", adapter });
  const base = { menuId: "map", sessionId: "s", baseRevision: 0 };
  assert.equal(m.handle({ ...base, requestId: 1, operation: "setView", target: { layout: "future" } }).reason, "filter"); assert.equal(m.handle({ ...base, requestId: 2, operation: "quickMove", target: { direction: "north", displayIndex: 0 } }).reason, "direction"); assert.equal(m.handle({ ...base, requestId: 3, operation: "pickup", target: { displayIndex: 96 }, modifiers: { button: 0 } }).reason, "bounds");
  const throwing = createMenuState({ menuId: "x", sessionId: "s", adapter: { snapshot: () => ({ safe: true }), restore: () => ({ safe: true }), click: () => { throw new Error("boom"); } } }); const response = throwing.handle({ menuId: "x", sessionId: "s", baseRevision: 0, requestId: 1, operation: "pickup", target: {}, modifiers: {} }); assert.equal(response.reason, "invalid"); assert.equal(response.revision, 0); assert.deepEqual(response.snapshot.adapter, { safe: true });
});

test("menu request ids are monotonic and restore mutation-then-throw adapters", () => {
  let value = 0; const calls = []; const adapter = { snapshot: () => ({ value }), restore: snapshot => { calls.push(["restore", snapshot]); value = snapshot.value; return { value }; }, click: () => { calls.push("mutate"); value += 1; throw new Error("after mutation"); } }; const m = createMenuState({ menuId: "m", sessionId: "s", adapter }); const base = { menuId: "m", sessionId: "s", baseRevision: 0, operation: "pickup", target: {}, modifiers: {} }; const before = m.snapshot(); calls.length = 0;
  const badStack = m.handle({ ...base, requestId: 3, target: { stack: { itemId: "invalid", count: 1, maxStackSize: 64 } } }); assert.equal(badStack.reason, "stack"); assert.equal(m.handle({ ...base, requestId: 2 }).reason, "old_request"); const failed = m.handle({ ...base, requestId: 4 }); assert.equal(failed.reason, "invalid"); assert.equal(calls[0], "mutate"); assert.equal(calls[1][0], "restore"); assert.deepEqual(m.snapshot(), before); assert.equal(m.handle({ ...base, requestId: 4 }).reason, "duplicate");
  assert.equal(m.handle({ ...base, requestId: 5, menuId: "other" }).reason, "menu"); assert.equal(m.handle({ ...base, requestId: 5 }).reason, "invalid");
});

test("menu requires transactional adapters and treats unverifiable rollback as fatal", () => {
  assert.throws(() => createMenuState({ menuId: "m", sessionId: "s", adapter: { snapshot: () => ({}) } }), /snapshot and restore/);
  let value = 0;
  assert.throws(() => createMenuState({ menuId: "m", sessionId: "s", adapter: { snapshot: () => ({ value }), restore: () => undefined } }), /round-trip/);
  const menuState = createMenuState({ menuId: "m", sessionId: "s", adapter: { snapshot: () => ({ value }), restore: snapshot => ({ value: snapshot.value }), click: () => { value += 1; throw new Error("boom"); } } });
  assert.throws(() => menuState.handle({ menuId: "m", sessionId: "s", baseRevision: 0, requestId: 1, operation: "pickup", target: {}, modifiers: {} }), /fatal adapter rollback failure/);
});

test("trace replay preserves trailing idle ticks and pending delayed requests", () => {
  const original = createDeterministicTransport({ handler: request => ({ id: request.id }), delay: request => request.delay });
  original.enqueue({ id: "ready", delay: 0 }); original.enqueue({ id: "pending", delay: 5 }); original.tick(); original.tick();
  const replayed = replayTrace(original.getTrace(), () => createDeterministicTransport({ handler: request => ({ id: request.id }) }));
  assert.deepEqual(replayed.trace, original.getTrace()); assert.deepEqual(replayed.snapshot.queue, original.getSnapshot().queue); assert.equal(replayed.snapshot.tick, 2);
});

test("transport exposes handler final snapshot and replay reproduces response/final snapshots", () => {
  const run = () => { let value = 0; const transport = createDeterministicTransport({ handler: request => ({ accepted: true, snapshot: { value: value += request.delta } }), snapshot: () => ({ value }) }); transport.enqueue({ delta: 2 }); transport.enqueue({ delta: 3 }); transport.drain(); return transport; };
  const original = run(); const replayed = replayTrace(original.getTrace(), () => { let value = 0; return createDeterministicTransport({ handler: request => ({ accepted: true, snapshot: { value: value += request.delta } }), snapshot: () => ({ value }) }); });
  assert.deepEqual(replayed.trace.entries.map(entry => entry.response), original.getTrace().entries.map(entry => entry.response)); assert.deepEqual(replayed.snapshot.handlerSnapshot, original.getSnapshot().handlerSnapshot);
});

function createMapStashAdapterForMenu(options = {}) {
  return createMapStashAdapter({ validLayouts: ["all", "normal", "other"], validRarities: ["all", "common", "uncommon", "rare", "epic", "legendary", "mythic", "unique", "other"], slots: [{ itemId: "cte2:map", count: 1, maxStackSize: 64, components: { map_stash: { layout: "normal", rarity: "rare" } } }], selector: s => ({ accepted: true, ...s.components.map_stash }), ...options });
}
