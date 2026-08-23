import { createCanonicalItemStack } from "./item-stack.js";

const OPERATIONS = new Set(["pickup", "place", "quickMove", "organize", "setView"]);
const clone = value => value === undefined ? undefined : structuredClone(value);
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
const snapshotsEqual = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));

export function validateMenuRequest(request, state, seen = new Set()) {
  const reject = reason => ({ accepted: false, reason });
  if (!request || typeof request !== "object") return reject("invalid");
  for (const key of ["menuId", "sessionId", "operation"]) if (typeof request[key] !== "string" || request[key].length === 0) return reject(key);
  if (!Number.isSafeInteger(request.baseRevision) || request.baseRevision < 0) return reject("revision");
  if (!Number.isSafeInteger(request.requestId) || request.requestId < 1) return reject("requestId");
  if (request.menuId !== state.menuId) return reject("menu");
  if (request.sessionId !== state.sessionId) return reject("session");
  if (seen.has(request.requestId)) return reject("duplicate");
  if (!OPERATIONS.has(request.operation)) return reject("unsupported");
  if (request.baseRevision !== state.revision) return reject("stale");
  if (request.target !== undefined && (request.target === null || typeof request.target !== "object" || Array.isArray(request.target))) return reject("target");
  if (request.modifiers !== undefined && (request.modifiers === null || typeof request.modifiers !== "object" || Array.isArray(request.modifiers))) return reject("modifiers");
  try { if (request.target?.stack !== undefined) createCanonicalItemStack(request.target.stack); } catch { return reject("stack"); }
  return { accepted: true, reason: "ok" };
}

export function createMenuState(options = {}) {
  if (typeof options.menuId !== "string" || typeof options.sessionId !== "string") throw new TypeError("menuId and sessionId required");
  if (!options.adapter || typeof options.adapter.snapshot !== "function" || typeof options.adapter.restore !== "function") throw new TypeError("adapter snapshot and restore are required");
  let state = { menuId: options.menuId, sessionId: options.sessionId, revision: Number.isSafeInteger(options.revision) && options.revision >= 0 ? options.revision : 0, adapter: options.adapter };
  const seen = new Set();
  let maxRequestId = 0;
  function snapshot() { const { adapter, ...publicState } = state; return clone({ ...publicState, adapter: adapter.snapshot() }); }
  function summary() { return clone({ menuId: state.menuId, sessionId: state.sessionId, revision: state.revision }); }
  function rollback(adapterSnapshot) {
    const restoredResult = state.adapter.restore(clone(adapterSnapshot));
    const restored = state.adapter.snapshot();
    if (!snapshotsEqual(restoredResult, adapterSnapshot) || !snapshotsEqual(restored, adapterSnapshot)) throw new Error("fatal adapter rollback mismatch");
  }
  try { rollback(state.adapter.snapshot()); }
  catch (error) { throw new TypeError("adapter snapshot and restore must round-trip", { cause: error }); }
  function correlated(request) { return request && typeof request === "object" && request.menuId === state.menuId && request.sessionId === state.sessionId && Number.isSafeInteger(request.requestId) && request.requestId >= 1; }
  function handle(request) {
    const before = snapshot();
    if (correlated(request) && request.requestId <= maxRequestId) return clone({ accepted: false, reason: request.requestId === maxRequestId ? "duplicate" : "old_request", revision: state.revision, requestId: request.requestId, snapshot: before });
    const validation = validateMenuRequest(request, state, seen);
    if (correlated(request)) { maxRequestId = request.requestId; seen.add(request.requestId); }
    if (!validation.accepted) return clone({ ...validation, revision: state.revision, requestId: request?.requestId ?? null, snapshot: before });
    let result;
    try {
      if (!state.adapter) throw new Error("missing adapter");
      if (request.operation === "pickup" || request.operation === "place") result = state.adapter.click(request.target ?? {}, undefined, request.modifiers?.button ?? 0);
      else if (request.operation === "quickMove") result = state.adapter.quickMove(request.target?.direction, request.target?.displayIndex ?? request.target?.index);
      else if (request.operation === "setView") result = state.adapter.setView({ page: request.target?.page, layout: request.target?.layout, rarity: request.target?.rarity });
      else result = state.adapter.organize();
    } catch (adapterError) {
      try { rollback(before.adapter); }
      catch (rollbackError) { throw new Error("fatal adapter rollback failure", { cause: rollbackError }); }
      return clone({ accepted: false, reason: "invalid", revision: state.revision, requestId: request.requestId, snapshot: snapshot() });
    }
    if (!result?.accepted) {
      try { rollback(before.adapter); }
      catch (rollbackError) { throw new Error("fatal adapter rollback failure", { cause: rollbackError }); }
    }
    if (result?.accepted && result.changed !== false && request.operation !== "setView") state.revision += 1;
    return clone({ accepted: Boolean(result?.accepted), reason: result?.reason ?? (result?.accepted ? "ok" : "rejected"), revision: state.revision, requestId: request.requestId, snapshot: snapshot(), result });
  }
  return Object.freeze({ handle, snapshot, summary, get seenRequestIds() { return [...seen]; } });
}
