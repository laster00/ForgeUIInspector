import test from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_ITEM_STACK,
  canMergeItemStacks,
  cloneItemStack,
  createCanonicalItemStack,
  getItemStackKey,
  isEmptyItemStack,
  itemStacksEqual,
  mergeItemStacks,
  splitItemStack,
} from "../emulator/runtime/item-stack.js";

test("empty stacks have one canonical representation and stable JSON", () => {
  const emptyA = createCanonicalItemStack(null);
  const emptyB = createCanonicalItemStack(undefined);
  const emptyC = createCanonicalItemStack({ itemId: "", count: 0 });
  assert.deepEqual(emptyA, EMPTY_ITEM_STACK);
  assert.deepEqual(emptyA, emptyB);
  assert.deepEqual(emptyB, emptyC);
  const expectedJson = JSON.stringify({ itemId: "", count: 0, maxStackSize: 0, tag: null, components: null });
  assert.equal(JSON.stringify(emptyC), expectedJson);
});

test("canonical stack deep clones inputs and recursively stabilizes object keys", () => {
  const input = {
    itemId: "cte2:mana_dust",
    count: 3,
    maxStackSize: 64,
    tag: { zeta: 1, alpha: { b: [1, 2], a: true } },
    components: { y: [{ q: 2, p: 1 }], x: 4 },
  };
  const canonical = createCanonicalItemStack(input);
  assert.deepEqual(canonical.tag, { alpha: { a: true, b: [1, 2] }, zeta: 1 });
  assert.deepEqual(canonical.components, { x: 4, y: [{ p: 1, q: 2 }] });
  input.tag.alpha.a = false;
  input.tag.alpha.b.push(99);
  input.components.y[0].p = 999;
  assert.deepEqual(canonical.tag.alpha, { a: true, b: [1, 2] });
  assert.deepEqual(canonical.components.y[0], { p: 1, q: 2 });
  const reordered = JSON.stringify({ itemId: canonical.itemId, count: canonical.count, maxStackSize: canonical.maxStackSize, tag: canonical.tag, components: canonical.components });
  assert.equal(JSON.stringify(canonical), JSON.stringify(JSON.parse(reordered)));
});

test("non-empty validation accepts exact boundaries and rejects malformed values", () => {
  const base = () => ({ itemId: "cte2:gem", count: 1, maxStackSize: 16, tag: {}, components: {} });
  assert.doesNotThrow(() => createCanonicalItemStack(base()));
  assert.doesNotThrow(() => createCanonicalItemStack({ ...base(), count: 16 }));
  assert.doesNotThrow(() => createCanonicalItemStack({ itemId: "", count: 0 }));
  for (const invalid of [
    [],
    {},
    "stack",
    { ...base(), itemId: "" },
    { ...base(), itemId: "no-colon" },
    { ...base(), itemId: ":path" },
    { ...base(), count: 0 },
    { ...base(), count: -1 },
    { ...base(), count: 17 },
    { ...base(), maxStackSize: 0 },
    { ...base(), count: Number.NaN },
    { ...base(), count: Number.POSITIVE_INFINITY },
    { ...base(), count: true },
    { ...base(), count: 1.5 },
    { ...base(), tag: [] },
    { ...base(), components: [] },
    { ...base(), tag: { fn: () => {} } },
    { ...base(), tag: { sym: Symbol.iterator } },
    { ...base(), tag: { big: 10n } },
    { ...base(), tag: { hole: undefined } },
  ]) {
    assert.throws(() => createCanonicalItemStack(invalid));
  }
  const cyclic = base();
  cyclic.tag.self = cyclic;
  assert.throws(() => createCanonicalItemStack(cyclic), /cycles/);
  assert.throws(() => createCanonicalItemStack({ ...base(), tag: { at: new Date(0) } }), /JSON-safe/);
});

test("keys include id, size limit, and normalized opaque data", () => {
  const first = createCanonicalItemStack({
    itemId: "cte2:wand",
    count: 1,
    maxStackSize: 1,
    tag: { b: 2, a: 1, nested: { z: [3, 1], y: null } },
    components: { custom_data: { unknownShape: [{ value: 7 }] } },
  });
  const second = createCanonicalItemStack({
    itemId: "cte2:wand",
    count: 1,
    maxStackSize: 1,
    tag: { a: 1, b: 2, nested: { y: null, z: [3, 1] } },
    components: { custom_data: { unknownShape: [{ value: 7 }] } },
  });
  const differentLimit = { ...cloneItemStack(first), maxStackSize: 2 };
  assert.equal(getItemStackKey(first), getItemStackKey(second));
  assert.notEqual(getItemStackKey(differentLimit), getItemStackKey(first));
  assert.equal(canMergeItemStacks(first, second), true);
  assert.equal(canMergeItemStacks(first, differentLimit), false);
  assert.equal(itemStacksEqual(first, second), true);
  assert.equal(itemStacksEqual(first, differentLimit), false);
});

test("merge and split do not mutate inputs and enforce limits", () => {
  const leftInput = { itemId: "cte2:stone", count: 30, maxStackSize: 64, tag: { data: "same" }, components: null };
  const rightInput = { itemId: "cte2:stone", count: 34, maxStackSize: 64, tag: { data: "same" }, components: null };
  const leftBefore = structuredClone(leftInput);
  const rightBefore = structuredClone(rightInput);
  const merged = mergeItemStacks(leftInput, rightInput);
  assert.deepEqual(merged, { itemId: "cte2:stone", count: 64, maxStackSize: 64, tag: { data: "same" }, components: null });
  assert.deepEqual(leftInput, leftBefore);
  assert.deepEqual(rightInput, rightBefore);
  assert.throws(() => mergeItemStacks(leftInput, { ...rightInput, count: 35 }));
  assert.throws(() => mergeItemStacks(leftInput, { ...rightInput, tag: { data: "different" } }));
  const source = { itemId: "cte2:stone", count: 10, maxStackSize: 64 };
  const sourceBefore = structuredClone(source);
  const [taken, remainder] = splitItemStack(source, 3);
  assert.deepEqual(taken, { itemId: "cte2:stone", count: 3, maxStackSize: 64, tag: null, components: null });
  assert.deepEqual(remainder, { itemId: "cte2:stone", count: 7, maxStackSize: 64, tag: null, components: null });
  assert.deepEqual(source, sourceBefore);
  for (const invalid of [0, -1, 1.5, Number.NaN, 10]) {
    assert.throws(() => splitItemStack(source, invalid));
  }
});

test("opaque data preserves special own keys and split outputs are deeply independent", () => {
  const tag = Object.create(null);
  Object.defineProperty(tag, "__proto__", { enumerable: true, value: { nested: 1 }, writable: true });
  const source = createCanonicalItemStack({
    itemId: "cte2:special",
    count: 4,
    maxStackSize: 8,
    tag,
    components: { constructor: { value: 2 } },
  });
  assert.equal(Object.hasOwn(source.tag, "__proto__"), true);
  assert.deepEqual(source.tag["__proto__"], { nested: 1 });
  const [taken, remainder] = splitItemStack(source, 2);
  taken.tag["__proto__"].nested = 9;
  taken.components.constructor.value = 7;
  assert.equal(remainder.tag["__proto__"].nested, 1);
  assert.equal(remainder.components.constructor.value, 2);
});

test("accessors, sparse opaque arrays, and negative zero are rejected", () => {
  const base = { itemId: "cte2:test", count: 1, maxStackSize: 8 };
  const accessorTag = {};
  Object.defineProperty(accessorTag, "value", { enumerable: true, get() { throw new Error("must not run"); } });
  assert.throws(() => createCanonicalItemStack({ ...base, tag: accessorTag }), /accessors/);
  const sparse = [];
  sparse.length = 1;
  assert.throws(() => createCanonicalItemStack({ ...base, tag: { sparse } }), /sparse/);
  assert.throws(() => createCanonicalItemStack({ ...base, count: -0 }));
  assert.throws(() => createCanonicalItemStack({ ...base, tag: { value: -0 } }), /JSON-safe/);
  assert.throws(() => createCanonicalItemStack({ ...base, components: { nested: [-0] } }), /JSON-safe/);
  assert.throws(() => splitItemStack({ ...base, count: 2 }, -0));
});
