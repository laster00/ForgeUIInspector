import test from "node:test";
import assert from "node:assert/strict";
import { createMapStashAdapter, MAP_STASH_CAPACITY, MAP_STASH_PAGE_SIZE } from "../emulator/runtime/adapters/map-stash.js";
import { EMPTY_ITEM_STACK } from "../emulator/runtime/item-stack.js";

const stack = (itemId, count, layout = "normal", rarity = "common", tag = null) => ({ itemId, count, maxStackSize: 64, tag, components: { map_stash: { layout, rarity } } });
const catalog = { validLayouts: ["all", "normal", "other"], validRarities: ["all", "common", "uncommon", "rare", "epic", "legendary", "mythic", "unique", "other"] };
test("map stash projects stable physical indices and clamps pages", () => {
  const slots = Array.from({ length: MAP_STASH_CAPACITY }, (_, i) => i < 100 ? stack(`cte2:map_${i}`, 1) : null);
  const adapter = createMapStashAdapter({ ...catalog, slots, page: 99, selector: (s) => ({ accepted: true, ...s.components.map_stash }) });
  assert.equal(adapter.projection().page, 1); assert.equal(adapter.projection().physicalIndices[0], 96); assert.equal(adapter.projection().physicalIndices.length, 4);
});
test("right pickup/place and organize preserve stacks without merging", () => {
  const adapter = createMapStashAdapter({ ...catalog, slots: [stack("cte2:a", 5, "normal", "rare"), stack("cte2:b", 1, "normal", "common"), stack("cte2:c", 2, "normal", "rare")], selector: s => ({ accepted: true, ...s.components.map_stash }) });
  const picked = adapter.click({ displayIndex: 0 }, null, 1); assert.equal(picked.carried.count, 3); assert.equal(picked.snapshot.storage[0].count, 2);
  const placed = adapter.click({ displayIndex: 0 }, picked.carried, 1); assert.equal(placed.carried.count, 2); assert.equal(placed.snapshot.storage[0].count, 3);
  const organized = adapter.organize(); assert.equal(organized.accepted, true); assert.equal(organized.snapshot.storage[1].itemId, "cte2:a");
});

test("left merge remainder/swap and right incompatible are exact no-ops", () => {
  const adapter = createMapStashAdapter({ ...catalog, slots: [stack("cte2:a", 60), stack("cte2:b", 2)], carried: stack("cte2:a", 8), selector: s => ({ accepted: true, ...s.components.map_stash }) });
  const merged = adapter.click({ displayIndex: 0 }, { itemId: "cte2:forged", count: 1, maxStackSize: 64 }, 0); assert.equal(merged.accepted, true); assert.equal(merged.snapshot.storage[0].count, 64); assert.equal(merged.carried.count, 4);
  const swapped = adapter.click({ displayIndex: 1 }, undefined, 0); assert.equal(swapped.accepted, true); assert.equal(swapped.snapshot.storage[1].itemId, "cte2:a"); assert.equal(swapped.carried.itemId, "cte2:b");
  const before = adapter.snapshot(); const rejected = adapter.click({ displayIndex: 0 }, undefined, 1); assert.equal(rejected.accepted, false); assert.deepEqual(adapter.snapshot(), before);
  const half = createMapStashAdapter({ ...catalog, slots: [stack("cte2:h", 2)], selector: s => ({ accepted: true, ...s.components.map_stash }) }); const first = half.click({ displayIndex: 0 }, undefined, 1); assert.equal(first.carried.count, 1); const second = half.click({ displayIndex: 0 }, undefined, 1); assert.equal(second.accepted, true); assert.equal(second.snapshot.storage[0].count, 2);
});
test("storage quick move rolls back when inventory is one item short", () => {
  const player = Array.from({ length: 36 }, () => stack("cte2:full", 64));
  const adapter = createMapStashAdapter({ ...catalog, slots: [stack("cte2:a", 2)], playerInventory: player, selector: s => ({ accepted: true, ...s.components.map_stash }) });
  const before = adapter.snapshot(); const result = adapter.quickMove("storage", 0); assert.equal(result.accepted, false); assert.deepEqual(adapter.snapshot(), before);
});

test("carried is server-owned and empty projected slots accept only classified compatible stacks", () => {
  const adapter = createMapStashAdapter({ ...catalog, slots: [stack("cte2:a", 4)], selector: s => ({ accepted: true, ...s.components.map_stash }) });
  const returned = adapter.snapshot(); returned.storage[0].count = 99;
  assert.equal(adapter.snapshot().storage[0].count, 4);
  const picked = adapter.click({ displayIndex: 0, carried: stack("cte2:forged", 1) }, stack("cte2:forged", 1), 0); assert.equal(picked.accepted, true); assert.equal(picked.carried.itemId, "cte2:a"); assert.equal(adapter.snapshot().carried.itemId, "cte2:a");
  const empty = createMapStashAdapter({ ...catalog, slots: [], carried: stack("cte2:b", 2), selector: s => ({ accepted: true, ...s.components.map_stash }) }); assert.equal(empty.click({ displayIndex: 0 }, undefined, 0).accepted, true); assert.equal(empty.snapshot().storage[0].itemId, "cte2:b");
  const unknown = createMapStashAdapter({ ...catalog, slots: [], carried: { itemId: "cte2:x", count: 1, maxStackSize: 64 }, selector: () => null }); assert.equal(unknown.click({ displayIndex: 0 }, undefined, 0).accepted, false);
});

test("constructor normalizes a canonical empty carried stack to null", () => {
  const adapter = createMapStashAdapter({ ...catalog, slots: [], carried: EMPTY_ITEM_STACK });
  assert.equal(adapter.snapshot().carried, null);
});

test("normal cursor operations use server-owned carried across player and stash slots", () => {
  const player = Array.from({ length: 36 }, () => null); player[0] = stack("cte2:a", 8); player[1] = stack("cte2:a", 60);
  const adapter = createMapStashAdapter({ ...catalog, slots: [stack("cte2:b", 2)], playerInventory: player, selector: s => ({ accepted: true, ...s.components.map_stash }) });
  assert.equal(adapter.click({ kind: "player", inventoryIndex: 0 }, undefined, 0).carried.count, 8);
  let result = adapter.click({ kind: "player", inventoryIndex: 1 }, undefined, 0); assert.equal(result.snapshot.playerInventory[1].count, 64); assert.equal(result.carried.count, 4);
  result = adapter.click({ kind: "player", inventoryIndex: 2 }, undefined, 1); assert.equal(result.snapshot.playerInventory[2].count, 1); assert.equal(result.carried.count, 3);
  result = adapter.click({ displayIndex: 0 }, undefined, 0); assert.equal(result.snapshot.storage[0].itemId, "cte2:a"); assert.equal(result.snapshot.storage[0].count, 3); assert.equal(result.carried.itemId, "cte2:b");
  result = adapter.click({ kind: "player", inventoryIndex: 3 }, undefined, 0); assert.equal(result.snapshot.playerInventory[3].itemId, "cte2:b"); assert.equal(result.carried, null);
  const before = adapter.snapshot(); assert.equal(adapter.click({ kind: "player", inventoryIndex: 36 }, undefined, 0).reason, "bounds"); assert.deepEqual(adapter.snapshot(), before);
});

test("projection resolves filtered display positions and quickMove uses display index", () => {
  const slots = Array.from({ length: 100 }, (_, i) => stack(`cte2:m${i}`, 1, i < 50 ? "normal" : "other")); const adapter = createMapStashAdapter({ ...catalog, slots, layout: "other", selector: s => ({ accepted: true, ...s.components.map_stash }) });
  assert.equal(adapter.projection().physicalIndices[0], 50); const result = adapter.quickMove("storage", 0); assert.equal(result.accepted, true); assert.equal(result.snapshot.storage[50], null); assert.equal(result.snapshot.storage[0].itemId, "cte2:m0");
  assert.equal(adapter.quickMove("storage", 96).accepted, false); assert.equal(adapter.quickMove("storage", 97).accepted, false);
});

test("player deposit is filter-independent, classified, non-compressing, and NBT-sensitive", () => {
  const source = stack("cte2:a", 2, "normal", "common", { nbt: 1 }); const different = stack("cte2:a", 2, "normal", "common", { nbt: 2 });
  const adapter = createMapStashAdapter({ ...catalog, slots: [different, null], layout: "other", playerInventory: [source], selector: s => ({ accepted: true, ...s.components.map_stash }) });
  const moved = adapter.quickMove("player", 0); assert.equal(moved.accepted, true); assert.equal(moved.physicalIndex, 1); assert.equal(moved.snapshot.storage[1].tag.nbt, 1);
  const unclassified = createMapStashAdapter({ ...catalog, slots: [null], playerInventory: [{ itemId: "cte2:u", count: 1, maxStackSize: 64 }], selector: () => null }); const before = unclassified.snapshot(); assert.equal(unclassified.quickMove("player", 0).accepted, false); assert.deepEqual(unclassified.snapshot(), before);
});

test("organize is explicit no_change and leaves unselected physical positions and opaque data intact", () => {
  const selected = stack("cte2:z", 1, "normal", "rare", { keep: true }); const unselected = stack("cte2:u", 2, "other", "common", { keep: true }); const adapter = createMapStashAdapter({ ...catalog, slots: [unselected, selected, null], layout: "normal", selector: s => ({ accepted: true, ...s.components.map_stash }) });
  const before = adapter.snapshot(); const first = adapter.organize(); assert.equal(first.changed, false); assert.equal(first.reason, "no_change"); assert.deepEqual(first.snapshot.storage[0], before.storage[0]);
  const changed = createMapStashAdapter({ ...catalog, slots: [stack("cte2:b", 1, "normal", "common"), stack("cte2:a", 1, "normal", "common")], selector: s => ({ accepted: true, ...s.components.map_stash }) }).organize(); assert.equal(changed.changed, true);
});

test("catalogs, canonical empty seeds, selector isolation, normalization, and strict restore are enforced", () => {
  assert.throws(() => createMapStashAdapter({ slots: [], validLayouts: ["all"], validRarities: ["all"] }));
  const catalogEmpty = createMapStashAdapter({ ...catalog, slots: [{ itemId: "", count: 0 }, null] }); assert.equal(catalogEmpty.snapshot().storage[0], null);
  let seen; const selector = input => { seen = input; input.count = 99; return { accepted: true, layout: "normal", rarity: " RARE " }; }; const adapter = createMapStashAdapter({ ...catalog, slots: [stack("cte2:a", 1)], selector, rarity: "RARE" }); assert.equal(adapter.snapshot().rarity, "rare"); assert.equal(adapter.snapshot().storage[0].count, 1); assert.equal(seen.count, 99);
  const trimmedLayout = createMapStashAdapter({ ...catalog, slots: [stack("cte2:t", 1)], layout: "normal", selector: () => ({ accepted: true, layout: " normal ", rarity: "rare" }) }); assert.deepEqual(trimmedLayout.projection().physicalIndices, [0]);
  const throwing = createMapStashAdapter({ ...catalog, slots: [stack("cte2:a", 1)], selector: input => { input.count = 88; throw new Error("selector"); } }); const beforeThrow = throwing.snapshot(); assert.equal(throwing.projection().physicalIndices.length, 0); assert.deepEqual(throwing.snapshot(), beforeThrow);
  const rejected = createMapStashAdapter({ ...catalog, slots: [stack("cte2:a", 1)], selector: () => ({ accepted: false, layout: "normal", rarity: "common" }) }); assert.equal(rejected.projection().physicalIndices.length, 0);
  const before = adapter.snapshot(); const changed = adapter.setView({ page: 99, layout: "all", rarity: "ALL" }); assert.equal(changed.accepted, true); assert.equal(changed.snapshot.page, 0); const restoreInput = structuredClone(before); restoreInput.page = 99; const restored = adapter.restore(restoreInput); assert.equal(restored.page, 0); assert.deepEqual(restored.storage[0], before.storage[0]); assert.throws(() => adapter.restore({ ...before, storage: [] }));
  const cleared = adapter.setView({ layout: " \t ", page: 0 }); assert.equal(cleared.accepted, true); assert.equal(cleared.snapshot.layout, "all");
});

test("unused filtered display slots map to deterministic empty physical slots without aliasing occupied matches", () => {
  const slots = Array.from({ length: 51 }, () => null); slots[50] = stack("cte2:filtered", 1, "other", "rare");
  const carried = stack("cte2:first", 2, "other", "rare");
  const adapter = createMapStashAdapter({ ...catalog, slots, layout: "other", carried, selector: s => ({ accepted: true, ...s.components.map_stash }) });
  assert.deepEqual(adapter.projection().physicalIndices, [50]);
  const first = adapter.click({ displayIndex: 95 }, undefined, 1); assert.equal(first.accepted, true); assert.equal(first.snapshot.storage[0].itemId, "cte2:first"); assert.equal(first.carried.count, 1); assert.equal(first.snapshot.storage[50].itemId, "cte2:filtered");
  const second = adapter.click({ displayIndex: 95 }, undefined, 1); assert.equal(second.accepted, true); assert.equal(second.snapshot.storage[0].itemId, "cte2:first"); assert.equal(second.snapshot.storage[1].itemId, "cte2:first"); assert.equal(second.snapshot.storage[50].itemId, "cte2:filtered"); assert.equal(second.carried, null);
});

test("quickMove uses merge-first production order and rolls back full storage", () => {
  const source = stack("cte2:a", 4); const player = Array.from({ length: 36 }, () => null); player[8] = stack("cte2:a", 62); player[35] = stack("cte2:b", 1); const adapter = createMapStashAdapter({ ...catalog, slots: [source], playerInventory: player, selector: s => ({ accepted: true, ...s.components.map_stash }) });
  const moved = adapter.quickMove("storage", 0); assert.equal(moved.accepted, true); assert.equal(moved.snapshot.playerInventory[8].count, 64); assert.equal(moved.snapshot.playerInventory[7].count, 2);
  const fullPlayer = Array.from({ length: 36 }, () => null); fullPlayer[0] = source; const full = createMapStashAdapter({ ...catalog, slots: Array.from({ length: 768 }, () => stack("cte2:b", 64)), playerInventory: fullPlayer, selector: s => ({ accepted: true, ...s.components.map_stash }) }); const fullBefore = full.snapshot(); assert.equal(full.quickMove("player", 0).accepted, false); assert.deepEqual(full.snapshot(), fullBefore);
});
