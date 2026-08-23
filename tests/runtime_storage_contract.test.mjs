import test from "node:test";
import assert from "node:assert/strict";

import { getItemStackKey } from "../emulator/runtime/item-stack.js";
import {
  cloneStorage,
  conservationMatches,
  createMemoryStorage,
  createStorageTransaction,
  getStorageSnapshot,
  readStorageSlot,
  runStorageTransaction,
  storageConservationMatches,
  transactionalStorageWrite,
  writeStorageSlot,
} from "../emulator/runtime/storage.js";

function stack(itemId, count, maxStackSize = 64, tag = null, components = null) {
  return { itemId, count, maxStackSize, tag, components };
}

test("memory storage canonicalizes slots and provides bounded read/write", () => {
  const initialInput = stack("cte2:mana_dust", 3, 64, { b: 2, a: 1 });
  const storage = createMemoryStorage(4, [initialInput, null]);
  initialInput.tag.a = 999;
  const expectedCanonical = [stack("cte2:mana_dust", 3, 64, { a: 1, b: 2 }), null, null, null];
  assert.deepEqual(storage.slots, expectedCanonical);
  assert.deepEqual(readStorageSlot(storage, 0), expectedCanonical[0]);
  assert.equal(readStorageSlot(storage, 2), null);
  for (const invalidIndex of [-1, 4, 1.5, Number.NaN]) {
    assert.throws(() => readStorageSlot(storage, invalidIndex));
    assert.throws(() => writeStorageSlot(storage, invalidIndex, null));
  }
});

test("write returns a new snapshot and preserves the source and input references", () => {
  const source = createMemoryStorage(3);
  const input = stack("cte2:gems", 5, 16, { rarity: "rare" });
  const written = writeStorageSlot(source, 0, input);
  input.tag.rarity = "changed";
  input.count = 99;
  assert.deepEqual(written.slots[0], stack("cte2:gems", 5, 16, { rarity: "rare" }));
  assert.equal(readStorageSlot(source, 0), null);
});

test("snapshots and clones are deep and independent", () => {
  const source = createMemoryStorage(2, [stack("cte2:bag", 1, 1, { nested: { value: [1] } })]);
  const snapshot = getStorageSnapshot(source);
  const clone = cloneStorage(source);
  snapshot.slots[0].tag.nested.value.push(99);
  clone.slots[0].count = 88;
  assert.deepEqual(source.slots[0].tag.nested.value, [1]);
  assert.equal(source.slots[0].count, 1);
});

test("conservation compares normalized opaque data totals independent of order", () => {
  const beforeItems = [
    { stack: stack("a:x", 10, 64, { b: 2, a: 1 }) },
    { stack: stack("b:y", 4, 64) },
  ];
  const afterItems = [
    { stack: stack("b:y", 4, 64) },
    { stack: stack("a:x", 10, 64, { a: 1, b: 2 }) },
  ];
  assert.equal(conservationMatches(beforeItems, afterItems), true);
  assert.equal(conservationMatches(beforeItems, [...afterItems, { stack: stack("c:z", 1, 64) }]), false);
  assert.throws(() => conservationMatches([{ stack: stack("a:x", 2), count: 1 }]), /count/);
  assert.throws(() => conservationMatches([{ stack: stack("a:x", 2), key: "forged" }]), /key/);
  assert.throws(() => conservationMatches([{ stack: stack("a:x", -1) }]), /ItemStack/);
  const beforeStorage = createMemoryStorage(3, [stack("a:x", 6), stack("b:y", 2)]);
  const afterStorage = createMemoryStorage(3, [stack("b:y", 2), stack("a:x", 2), stack("a:x", 4)]);
  assert.equal(storageConservationMatches(beforeStorage, afterStorage), true);
  assert.equal(storageConservationMatches(beforeStorage, createMemoryStorage(3, [stack("a:x", 7)])), false);
});

test("transactional writes validate bounds, malformed stacks, and rollback atomically", () => {
  const source = createMemoryStorage(3, [stack("cte2:old", 2, 64)]);
  const beforeSnapshot = getStorageSnapshot(source);
  assert.throws(
    () => transactionalStorageWrite(source, [
      { slotIndex: 0, stack: null },
      { slotIndex: 1, stack: stack("cte2:new", 3) },
      { slotIndex: 3, stack: stack("cte2:bad", 1) },
    ]),
  );
  assert.deepEqual(getStorageSnapshot(source), beforeSnapshot);
  assert.throws(
    () => transactionalStorageWrite(source, [{ slotIndex: 0, stack: { itemId: "invalid", count: 1, maxStackSize: 64 } }]),
  );
  assert.deepEqual(getStorageSnapshot(source), beforeSnapshot);
  const committed = transactionalStorageWrite(source, [
    { slotIndex: 0, stack: null },
    { slotIndex: 1, stack: stack("cte2:new", 3) },
  ]);
  assert.equal(committed.slots[0], null);
  assert.deepEqual(committed.slots[1], stack("cte2:new", 3));
  for (const slotIndex of [-1, 3, 1.5, "1", Number.NaN]) {
    assert.throws(() => transactionalStorageWrite(source, [{ slotIndex, stack: stack("cte2:new", 1) }]));
  }
});

test("storage slots reject undefined, sparse arrays, and empty stack objects", () => {
  assert.throws(() => createMemoryStorage(1, [undefined]));
  assert.throws(() => createMemoryStorage(1, [{ itemId: "", count: 0 }]));
  const sparse = createMemoryStorage(2);
  delete sparse.slots[0];
  assert.throws(() => getStorageSnapshot(sparse), /sparse/);
  const undefinedSlot = createMemoryStorage(1);
  undefinedSlot.slots[0] = undefined;
  assert.throws(() => readStorageSlot(undefinedSlot, 0));
  const emptySlot = createMemoryStorage(1);
  emptySlot.slots[0] = { itemId: "", count: 0 };
  assert.throws(() => getStorageSnapshot(emptySlot));
});

test("storage snapshots preserve opaque special keys without prototype mutation", () => {
  const tag = Object.create(null);
  Object.defineProperty(tag, "__proto__", {
    enumerable: true,
    value: { nested: 1 },
    writable: true,
  });
  const storage = createMemoryStorage(1, [stack("cte2:special", 1, 1, tag)]);
  const snapshot = getStorageSnapshot(storage);
  assert.equal(Object.hasOwn(snapshot.slots[0].tag, "__proto__"), true);
  assert.deepEqual(snapshot.slots[0].tag["__proto__"], { nested: 1 });
  assert.equal(Object.getPrototypeOf(snapshot.slots[0].tag), Object.prototype);
  assert.equal(({}).nested, undefined);
});

test("runStorageTransaction rolls back exceptions and optional expected counts", () => {
  const base = createMemoryStorage(4, [stack("cte2:a", 10, 20)]);
  const before = getStorageSnapshot(base);
  assert.throws(
    () => runStorageTransaction(base, (draft) => {
      draft.slots[0] = null;
      draft.slots[1] = stack("cte2:b", 5, 20);
      throw new Error("boom");
    }),
    /boom/,
  );
  assert.deepEqual(getStorageSnapshot(base), before);
  const moved = runStorageTransaction(
    base,
    (draft) => {
      draft.slots[0] = null;
      draft.slots[1] = stack("cte2:a", 10, 20);
    },
    { expectedCounts: { [getItemStackKey(stack("cte2:a", 1, 20))]: 10 } },
  );
  assert.deepEqual(moved.storage.slots, [null, stack("cte2:a", 10, 20), null, null]);
  assert.throws(
    () => runStorageTransaction(
      base,
      (draft) => {
        draft.slots[0] = null;
      },
      { expectedCounts: { [getItemStackKey(stack("cte2:a", 1, 20))]: 10 } },
    ),
  );
});

test("createStorageTransaction commits only after all checks pass", () => {
  const base = createMemoryStorage(3, [stack("cte2:a", 8, 16, { k: 1 })]);
  const before = getStorageSnapshot(base);
  const failed = createStorageTransaction(base, { conservation: true });
  failed.draft.slots[0] = null;
  failed.draft.slots[1] = stack("cte2:a", 9, 16, { k: 1 });
  assert.throws(() => failed.commit());
  assert.equal(failed.isCommitted(), false);
  assert.deepEqual(getStorageSnapshot(base), before);
  const success = createStorageTransaction(base);
  success.draft.slots[0] = null;
  success.draft.slots[1] = stack("cte2:a", 4, 16, { k: 1 });
  success.draft.slots[2] = stack("cte2:a", 4, 16, { k: 1 });
  const committed = success.commit({ expectedCounts: { [getItemStackKey(stack("cte2:a", 1, 16, { k: 1 }))]: 8 } });
  assert.equal(success.isCommitted(), true);
  assert.deepEqual(committed.slots, [null, stack("cte2:a", 4, 16, { k: 1 }), stack("cte2:a", 4, 16, { k: 1 })]);
  assert.throws(() => success.commit());
  assert.deepEqual(getStorageSnapshot(base), before);
});
