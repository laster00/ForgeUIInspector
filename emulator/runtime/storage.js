import {
  cloneItemStack,
  createCanonicalItemStack,
  getItemStackKey,
} from "./item-stack.js";

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertCapacity(capacity) {
  if (!Number.isSafeInteger(capacity) || capacity < 0) {
    throw new TypeError("capacity must be a non-negative safe integer");
  }
}

function deepCloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(deepCloneValue);
  }
  if (isPlainObject(value)) {
    const result = {};
    for (const key of Object.keys(value)) {
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: deepCloneValue(value[key]),
        writable: true,
      });
    }
    return result;
  }
  return value;
}

function assertSlotIndex(storage, slotIndex) {
  if (!Number.isSafeInteger(slotIndex) || slotIndex < 0 || slotIndex >= storage.capacity) {
    throw new RangeError("slotIndex out of bounds: " + slotIndex);
  }
}

export function createMemoryStorage(capacity, initialSlots = []) {
  assertCapacity(capacity);
  if (!Array.isArray(initialSlots)) {
    throw new TypeError("initialSlots must be an array");
  }
  if (initialSlots.length > capacity) {
    throw new RangeError("initialSlots cannot exceed capacity");
  }
  const slots = Array.from({ length: capacity }, () => null);
  initialSlots.forEach((slot, index) => {
    slots[index] = slot === null ? null : cloneNonEmptyItemStack(slot);
  });
  return { kind: "memory", capacity, slots };
}

export function getStorageSnapshot(storage) {
  assertStorageShape(storage);
  return { kind: storage.kind, capacity: storage.capacity, slots: deepCloneValue(storage.slots) };
}

export function cloneStorage(storage) {
  return getStorageSnapshot(storage);
}

export function readStorageSlot(storage, slotIndex) {
  assertStorageShape(storage);
  assertSlotIndex(storage, slotIndex);
  const slot = storage.slots[slotIndex];
  return slot === null ? null : cloneNonEmptyItemStack(slot);
}

function cloneNonEmptyItemStack(stack) {
  const canonical = createCanonicalItemStack(stack);
  if (canonical.itemId === "" || canonical.count === 0) {
    throw new TypeError("storage slots must contain null or a non-empty ItemStack");
  }
  return cloneItemStack(canonical);
}

function writeSlot(draft, slotIndex, stack) {
  draft.slots[slotIndex] = stack === null ? null : cloneNonEmptyItemStack(stack);
}

function conservationTotalsFromSlots(slots) {
  const totals = new Map();
  slots.forEach((slot) => {
    if (slot === null || slot === undefined) {
      return;
    }
    const canonical = createCanonicalItemStack(slot);
    const key = getItemStackKey(canonical);
    totals.set(key, (totals.get(key) ?? 0) + canonical.count);
  });
  return totals;
}

function validateFinalState(storage, expectedCounts) {
  assertStorageShape(storage);
  if (expectedCounts === undefined || expectedCounts === null) {
    return;
  }
  if (!isPlainObject(expectedCounts)) {
    throw new TypeError("expectedCounts must be an object keyed by ItemStack key");
  }
  const actual = conservationTotalsFromSlots(storage.slots);
  const actualKeys = [...actual.keys()].sort((left, right) => String(left).localeCompare(String(right)));
  const expectedKeys = Object.keys(expectedCounts).sort((left, right) => String(left).localeCompare(String(right)));
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error("expected item keys do not match final storage");
  }
  for (const key of expectedKeys) {
    if (actual.get(key) !== expectedCounts[key]) {
      throw new Error("expected total mismatch for " + key);
    }
  }
}

function commitValidatedDraft(sourceStorage, draft, options = {}, expectedCounts = undefined) {
  const after = getStorageSnapshot(draft);
  validateFinalState(after, expectedCounts);
  if (sourceStorage.capacity !== draft.capacity) {
    throw new Error("draft capacity mismatch");
  }
  if (options.conservation === true && !storageConservationMatches(sourceStorage, after)) {
    throw new Error("conservation check failed; rolled back");
  }
  return after;
}

export function writeStorageSlot(storage, slotIndex, stack) {
  const draft = cloneStorage(storage);
  assertSlotIndex(draft, slotIndex);
  writeSlot(draft, slotIndex, stack);
  return commitValidatedDraft(storage, draft);
}

export function transactionalStorageWrite(storage, mutations) {
  if (!Array.isArray(mutations)) {
    throw new TypeError("mutations must be an array");
  }
  const draft = cloneStorage(storage);
  for (const mutation of mutations) {
    if (!isPlainObject(mutation)) {
      throw new TypeError("each mutation must be an object");
    }
    assertSlotIndex(draft, mutation.slotIndex);
    writeSlot(draft, mutation.slotIndex, mutation.stack);
  }
  return commitValidatedDraft(storage, draft);
}

export function runStorageTransaction(baseStorage, operation, options = {}) {
  if (typeof operation !== "function") {
    throw new TypeError("operation must be a function");
  }
  const before = getStorageSnapshot(baseStorage);
  const draft = cloneStorage(baseStorage);
  let result;
  try {
    result = operation(draft);
  } catch (error) {
    void before;
    throw error;
  }
  const after = getStorageSnapshot(draft);
  validateFinalState(after, options.expectedCounts);
  if (options.conservation === true && !storageConservationMatches(before, after)) {
    throw new Error("Conservation check failed");
  }
  return { storage: after, result };
}

function conservationTotalsFromItems(items) {
  const totals = new Map();
  for (const item of items) {
    if (!isPlainObject(item)) {
      throw new TypeError("conservation items must be objects");
    }
    const canonical = createCanonicalItemStack(item.stack);
    if (canonical.itemId === "" || canonical.count === 0) {
      throw new TypeError("conservation items must contain non-empty ItemStacks");
    }
    const key = getItemStackKey(canonical);
    if (item.key !== undefined && item.key !== key) {
      throw new Error("conservation item key does not match stack");
    }
    if (item.count !== undefined && item.count !== canonical.count) {
      throw new Error("conservation item count does not match stack");
    }
    totals.set(key, (totals.get(key) ?? 0) + canonical.count);
  }
  return totals;
}

export function conservationMatches(beforeItems, afterItems) {
  const before = conservationTotalsFromItems(beforeItems);
  const after = conservationTotalsFromItems(afterItems);
  if (before.size !== after.size) {
    return false;
  }
  for (const [key, count] of before) {
    if (!after.has(key) || after.get(key) !== count) {
      return false;
    }
  }
  return true;
}

export function storageConservationMatches(beforeStorage, afterStorage) {
  assertStorageShape(beforeStorage);
  assertStorageShape(afterStorage);
  if (beforeStorage.capacity !== afterStorage.capacity) {
    throw new TypeError("capacities must match");
  }
  const before = conservationTotalsFromSlots(beforeStorage.slots);
  const after = conservationTotalsFromSlots(afterStorage.slots);
  if (before.size !== after.size) {
    return false;
  }
  for (const [key, count] of before) {
    if (!after.has(key) || after.get(key) !== count) {
      return false;
    }
  }
  return true;
}

export function createStorageTransaction(storage, options = {}) {
  const baseSnapshot = getStorageSnapshot(storage);
  const draft = cloneStorage(storage);
  let committed = false;
  return {
    draft,
    isCommitted() {
      return committed;
    },
    commit(finalChecks = {}) {
      if (committed) {
        throw new Error("transaction already committed");
      }
      const after = getStorageSnapshot(draft);
      validateFinalState(after, finalChecks.expectedCounts);
      const requireConservation = options.conservation === true && finalChecks.conservation !== false;
      if (requireConservation && !storageConservationMatches(baseSnapshot, after)) {
        throw new Error("transaction conservation check failed; rolled back");
      }
      committed = true;
      return after;
    },
  };
}

function assertStorageShape(storage) {
  if (!isPlainObject(storage)) {
    throw new TypeError("storage must be an object");
  }
  if (storage.kind !== "memory") {
    throw new TypeError('storage.kind must be "memory"');
  }
  assertCapacity(storage.capacity);
  if (!Array.isArray(storage.slots)) {
    throw new TypeError("storage.slots must be an array");
  }
  if (storage.slots.length !== storage.capacity) {
    throw new RangeError("storage.slots length must equal capacity");
  }
  for (let index = 0; index < storage.slots.length; index += 1) {
    if (!Object.hasOwn(storage.slots, index)) {
      throw new TypeError("storage.slots must not be sparse");
    }
    const slot = storage.slots[index];
    if (slot !== null) {
      const canonical = createCanonicalItemStack(slot);
      if (canonical.itemId === "" || canonical.count === 0) {
        throw new TypeError("storage slots must contain null or a non-empty ItemStack");
      }
    }
  }
}
