/**
 * Canonical ItemStack primitives for the pure runtime emulator.
 * No DOM, fixture, or emulator dependencies.
 */

export const EMPTY_ITEM_STACK = Object.freeze({
  itemId: "",
  count: 0,
  maxStackSize: 0,
  tag: null,
  components: null,
});

const ITEM_ID_PATTERN = /^(?<namespace>[a-z0-9_.-]+):(?<path>[a-z0-9/._-]+)$/;

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isInteger(value) {
  return Number.isSafeInteger(value);
}

function assertNoAccessors(value) {
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor.get !== undefined || descriptor.set !== undefined) {
      throw new TypeError("ItemStack data must not contain accessors");
    }
  }
}

function defineDataProperty(target, key, value) {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

function stableValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (isPlainObject(value)) {
    const result = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = stableValue(value[key]);
    }
    return result;
  }
  return value;
}

function stableCloneJsonValue(value, activeParents) {
  if (value === null) {
    return null;
  }
  if (activeParents.has(value)) {
    throw new TypeError("opaque ItemStack data must not contain cycles");
  }
  const valueType = typeof value;
  if (valueType === "string" || valueType === "boolean") {
    return value;
  }
  if (valueType === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new TypeError("opaque ItemStack data must be JSON-safe");
    }
    return value;
  }
  if (valueType !== "object") {
    if (valueType === "undefined" || valueType === "function" || valueType === "symbol" || valueType === "bigint") {
      throw new TypeError("opaque ItemStack data must be JSON-safe");
    }
    throw new TypeError("opaque ItemStack data must be JSON-safe");
  }
  activeParents.add(value);
  try {
    if (Array.isArray(value)) {
      assertNoAccessors(value);
      const result = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) {
          throw new TypeError("opaque ItemStack arrays must not be sparse");
        }
        result.push(stableCloneJsonValue(value[index], activeParents));
      }
      return result;
    }
    if (isPlainObject(value)) {
      assertNoAccessors(value);
      const result = {};
      for (const key of Object.keys(value).sort()) {
        defineDataProperty(result, key, stableCloneJsonValue(value[key], activeParents));
      }
      return result;
    }
    throw new TypeError("opaque ItemStack data must be JSON-safe");
  } finally {
    activeParents.delete(value);
  }
}

function deepCloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(deepCloneValue);
  }
  if (isPlainObject(value)) {
    const result = {};
    for (const key of Object.keys(value)) {
      defineDataProperty(result, key, deepCloneValue(value[key]));
    }
    return result;
  }
  return value;
}

function normalizeEmpty() {
  return deepCloneValue(EMPTY_ITEM_STACK);
}

function validateStackShape(stack) {
  if (!isPlainObject(stack)) {
    throw new TypeError("ItemStack must be an object");
  }
  assertNoAccessors(stack);
  for (const key of ["itemId", "count", "maxStackSize"]) {
    if (!Object.hasOwn(stack, key)) {
      throw new TypeError("ItemStack." + key + " is required");
    }
  }
  const itemId = stack.itemId;
  const count = stack.count;
  const maxStackSize = stack.maxStackSize;
  if (typeof itemId !== "string" || itemId.length === 0 || !ITEM_ID_PATTERN.test(itemId)) {
    throw new TypeError("ItemStack.itemId must be namespace:path");
  }
  if (!isInteger(count) || !isInteger(maxStackSize)) {
    throw new TypeError("ItemStack count and maxStackSize must be safe integers");
  }
  if (maxStackSize < 1 || count < 1 || count > maxStackSize) {
    throw new RangeError(
      "ItemStack requires 1 <= count <= maxStackSize (got count=" + count + ", maxStackSize=" + maxStackSize + ")",
    );
  }
  if (stack.tag !== undefined && stack.tag !== null && !isPlainObject(stack.tag)) {
    throw new TypeError("ItemStack.tag must be an object or null");
  }
  if (stack.components !== undefined && stack.components !== null && !isPlainObject(stack.components)) {
    throw new TypeError("ItemStack.components must be an object or null");
  }
}

function cloneOpaqueFields(stack) {
  return {
    tag: stack.tag === undefined || stack.tag === null ? null : stableCloneJsonValue(stack.tag, new Set()),
    components:
      stack.components === undefined || stack.components === null
        ? null
        : stableCloneJsonValue(stack.components, new Set()),
  };
}

function canonicalizeNonEmpty(stack) {
  validateStackShape(stack);
  const opaque = cloneOpaqueFields(stack);
  return {
    itemId: stack.itemId,
    count: stack.count,
    maxStackSize: stack.maxStackSize,
    tag: opaque.tag,
    components: opaque.components,
  };
}

export function isEmptyItemStack(value) {
  if (!isPlainObject(value)) {
    return false;
  }
  assertNoAccessors(value);
  const allowedKeys = new Set(["itemId", "count", "maxStackSize", "tag", "components"]);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      return false;
    }
  }
  return (
    value.itemId === "" &&
    value.count === 0 &&
    (value.maxStackSize === undefined || value.maxStackSize === 0) &&
    (value.tag === undefined || value.tag === null) &&
    (value.components === undefined || value.components === null)
  );
}

export function createCanonicalItemStack(input) {
  if (input === null || input === undefined) {
    return normalizeEmpty();
  }
  if (isEmptyItemStack(input)) {
    return normalizeEmpty();
  }
  return canonicalizeNonEmpty(input);
}

export function cloneItemStack(stack) {
  return createCanonicalItemStack(stack);
}

export function getItemStackKey(stack) {
  const canonical = createCanonicalItemStack(stack);
  return JSON.stringify({
    components: canonical.components,
    itemId: canonical.itemId,
    maxStackSize: canonical.maxStackSize,
    tag: canonical.tag,
  });
}

export function itemStacksEqual(left, right) {
  const leftCanonical = createCanonicalItemStack(left);
  const rightCanonical = createCanonicalItemStack(right);
  return getItemStackKey(leftCanonical) === getItemStackKey(rightCanonical) && leftCanonical.count === rightCanonical.count;
}

export function canMergeItemStacks(left, right) {
  return getItemStackKey(left) === getItemStackKey(right);
}

export function mergeItemStacks(first, second) {
  const left = createCanonicalItemStack(first);
  const right = createCanonicalItemStack(second);
  if (!canMergeItemStacks(left, right)) {
    throw new Error("Cannot merge incompatible ItemStacks");
  }
  const mergedCount = left.count + right.count;
  if (mergedCount > left.maxStackSize) {
    throw new RangeError("Merged ItemStack exceeds maxStackSize");
  }
  return {
    itemId: left.itemId,
    count: mergedCount,
    maxStackSize: left.maxStackSize,
    tag: left.tag,
    components: left.components,
  };
}

export function splitItemStack(stack, requestedCount) {
  const source = createCanonicalItemStack(stack);
  if (!isInteger(requestedCount) || requestedCount < 1 || requestedCount >= source.count) {
    throw new RangeError("split count must be an integer in [1, count - 1]");
  }
  const remainderCount = source.count - requestedCount;
  return [
    createCanonicalItemStack({ ...source, count: requestedCount }),
    createCanonicalItemStack({ ...source, count: remainderCount }),
  ];
}

export function assertValidItemStack(stack) {
  createCanonicalItemStack(stack);
  return true;
}
