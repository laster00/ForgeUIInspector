/** Pure input normalization and hit testing for the Forge UI runtime. */

const TYPES = new Set(["pointermove", "pointerdown", "pointerup", "wheel", "keydown", "keyup"]);
const PRIORITY = new Map([["adapter", 0], ["slot", 1], ["widget", 2], ["container", 3]]);

function finiteNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}
function integer(value, name) {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${name} must be a safe integer`);
  return value;
}
function bool(value, name) { if (typeof value !== "boolean") throw new TypeError(`${name} must be boolean`); return value; }
function validRect(rect) {
  if (!rect || !["left", "top", "width", "height"].every(key => typeof rect[key] === "number" && Number.isFinite(rect[key]))) throw new TypeError("invalid hit rect");
  if (rect.width <= 0 || rect.height <= 0) throw new RangeError("hit rect must be positive");
  return Object.freeze({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
}
function cloneTarget(target) { return target === undefined ? null : structuredClone(target); }
function targetKey(target, parents = new Set()) {
  if (target === null || typeof target !== "object") return JSON.stringify(target);
  if (parents.has(target)) throw new TypeError("hit target must not cycle"); parents.add(target);
  const keys = Reflect.ownKeys(target).filter(key => typeof key === "string").sort(); const result = {};
  for (const key of keys) { const descriptor = Object.getOwnPropertyDescriptor(target, key); if (!descriptor || descriptor.get || descriptor.set) throw new TypeError("hit target must not contain accessors"); result[key] = targetKey(target[key], parents); }
  parents.delete(target); return `{${keys.map(key => JSON.stringify(key) + ":" + result[key]).join(",")}}`;
}

export function normalizeInput(event) {
  if (!event || typeof event !== "object" || !TYPES.has(event.type)) throw new TypeError("unknown input type");
  const result = {
    type: event.type, x: finiteNumber(event.x, "x"), y: finiteNumber(event.y, "y"),
    button: integer(event.button ?? 0, "button"), buttons: integer(event.buttons ?? 0, "buttons"),
    deltaY: finiteNumber(event.deltaY ?? 0, "deltaY"),
    shiftKey: bool(event.shiftKey ?? false, "shiftKey"), ctrlKey: bool(event.ctrlKey ?? false, "ctrlKey"),
    altKey: bool(event.altKey ?? false, "altKey"), metaKey: bool(event.metaKey ?? false, "metaKey"),
    key: event.key ?? "", tick: integer(event.tick ?? 0, "tick"),
  };
  if (result.x < 0 || result.y < 0 || result.button < -1 || result.button > 2 || result.buttons < 0 || result.buttons > 7 || result.tick < 0) {
    throw new RangeError("input value outside runtime range");
  }
  if (typeof result.key !== "string") throw new TypeError("key must be a string");
  if (result.key.length > 128) throw new RangeError("key is too long");
  return Object.freeze(result);
}

export function cssPointToLogicalPoint(point, rect, logicalWidth = 474, logicalHeight = 326) {
  if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top) || !Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 0 || rect.height <= 0) throw new TypeError("invalid bounding rect");
  const x = finiteNumber(point?.x, "x"); const y = finiteNumber(point?.y, "y");
  if (![logicalWidth, logicalHeight].every(Number.isFinite) || logicalWidth <= 0 || logicalHeight <= 0) throw new RangeError("invalid logical size");
  return { x: (x - rect.left) * logicalWidth / rect.width, y: (y - rect.top) * logicalHeight / rect.height };
}

export function logicalPointFromViewport(clientX, clientY, rect, logicalWidth = 474, logicalHeight = 326) {
  return cssPointToLogicalPoint({ x: clientX, y: clientY }, rect, logicalWidth, logicalHeight);
}

function contains(rect, x, y) { return x >= rect.left && x < rect.left + rect.width && y >= rect.top && y < rect.top + rect.height; }

export function createHitTester(registrations = []) {
  if (!Array.isArray(registrations)) throw new TypeError("registrations must be an array");
  const entries = [];
  for (const registration of registrations) {
    if (!registration || !PRIORITY.has(registration.kind)) throw new TypeError("invalid hit registration");
    const target = cloneTarget(registration.target); entries.push(Object.freeze({ kind: registration.kind, rect: validRect(registration.rect), target, targetKey: targetKey(target), order: entries.length }));
  }
  function hitTest(point) {
    finiteNumber(point?.x, "x"); finiteNumber(point?.y, "y");
    const candidates = entries.filter((entry) => contains(entry.rect, point.x, point.y));
    candidates.sort((a, b) => (PRIORITY.get(a.kind) - PRIORITY.get(b.kind)) || (a.order - b.order));
    return candidates.length ? cloneTarget(candidates[0].target) : null;
  }
  return Object.freeze({ hitTest, registrations: () => entries.map(({ order, targetKey: _key, ...entry }) => cloneTarget(entry)) });
}

export function hitTest(registrations, point) { return createHitTester(registrations).hitTest(point); }

export function hoverTransition(previousTarget, nextTarget) {
  const same = previousTarget !== null && previousTarget !== undefined && nextTarget !== null && nextTarget !== undefined && (() => { try { return targetKey(previousTarget) === targetKey(nextTarget); } catch { return false; } })();
  if (previousTarget === nextTarget || same) return Object.freeze({ type: "move", from: previousTarget ?? null, to: nextTarget ?? null });
  if (previousTarget == null) return Object.freeze({ type: "enter", from: null, to: nextTarget ?? null });
  if (nextTarget == null) return Object.freeze({ type: "leave", from: previousTarget, to: null });
  return Object.freeze({ type: "leave", from: previousTarget, to: nextTarget, then: "enter" });
}

export function pointerGesture(event) {
  const input = normalizeInput(event);
  if (!input.type.startsWith("pointer")) throw new TypeError("pointer gesture requires pointer input");
  return Object.freeze({ button: input.button, buttons: input.buttons, shiftKey: input.shiftKey, ctrlKey: input.ctrlKey, altKey: input.altKey, metaKey: input.metaKey, type: input.type, x: input.x, y: input.y, tick: input.tick });
}
