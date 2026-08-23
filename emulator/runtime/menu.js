import { createCanonicalItemStack } from "./item-stack.js";

const OPERATIONS = new Set(["pickup", "place", "quickMove", "organize", "setView"]);
const clone = value => value === undefined ? undefined : structuredClone(value);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

const fingerprint = request => JSON.stringify(stable(request));
const snapshotsEqual = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));

function dependsOnProjection(request) {
  if (request.operation === "organize") return true;
  if (request.operation === "quickMove") return request.target?.direction === "storage";
  if (request.operation === "pickup" || request.operation === "place") return request.target?.kind !== "player";
  return false;
}

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
  if (dependsOnProjection(request)) {
    if (!Number.isSafeInteger(request.baseViewGeneration) || request.baseViewGeneration < 0) return reject("view_generation");
    if (request.baseViewGeneration !== state.viewGeneration) return reject("stale_view");
  }
  try { if (request.target?.stack !== undefined) createCanonicalItemStack(request.target.stack); } catch { return reject("stack"); }
  return { accepted: true, reason: "ok" };
}

export function createMenuState(options = {}) {
  if (typeof options.menuId !== "string" || typeof options.sessionId !== "string") throw new TypeError("menuId and sessionId required");
  if (!options.adapter || typeof options.adapter.snapshot !== "function" || typeof options.adapter.restore !== "function") throw new TypeError("adapter snapshot and restore are required");
  let state = {
    menuId: options.menuId,
    sessionId: options.sessionId,
    revision: Number.isSafeInteger(options.revision) && options.revision >= 0 ? options.revision : 0,
    viewGeneration: Number.isSafeInteger(options.viewGeneration) && options.viewGeneration >= 0 ? options.viewGeneration : 0,
    adapter: options.adapter,
  };
  const seen = new Set();
  const responses = new Map();
  let maxRequestId = 0;
  const adapterSnapshot = () => state.adapter.snapshot();
  function snapshot() { const { adapter, ...publicState } = state; return clone({ ...publicState, adapter: adapterSnapshot() }); }
  function summary() { return clone({ menuId: state.menuId, sessionId: state.sessionId, revision: state.revision, viewGeneration: state.viewGeneration }); }
  function rollback(adapterBefore) {
    const restoredResult = state.adapter.restore(clone(adapterBefore));
    const restored = adapterSnapshot();
    if (!snapshotsEqual(restoredResult, adapterBefore) || !snapshotsEqual(restored, adapterBefore)) throw new Error("fatal adapter rollback mismatch");
  }
  try {
    rollback(adapterSnapshot());
  } catch (error) {
    throw new TypeError("adapter snapshot and restore must round-trip", { cause: error });
  }
  const correlated = request => request && typeof request === "object" && request.menuId === state.menuId && request.sessionId === state.sessionId && Number.isSafeInteger(request.requestId) && request.requestId >= 1;
  const cache = (request, response) => {
    if (correlated(request)) responses.set(request.requestId, { fingerprint: fingerprint(request), response: clone(response) });
    return response;
  };

  function handle(request) {
    const before = snapshot();
    if (correlated(request) && responses.has(request.requestId)) {
      const cached = responses.get(request.requestId);
      if (cached.fingerprint === fingerprint(request)) return clone(cached.response);
      return clone({ accepted: false, reason: "request_conflict", revision: state.revision, viewGeneration: state.viewGeneration, requestId: request.requestId, snapshot: before });
    }
    if (correlated(request) && request.requestId <= maxRequestId) {
      return clone({ accepted: false, reason: "old_request", revision: state.revision, viewGeneration: state.viewGeneration, requestId: request.requestId, snapshot: before });
    }
    const validation = validateMenuRequest(request, state, seen);
    if (correlated(request)) {
      maxRequestId = request.requestId;
      seen.add(request.requestId);
    }
    if (!validation.accepted) {
      return clone(cache(request, { ...validation, revision: state.revision, viewGeneration: state.viewGeneration, requestId: request?.requestId ?? null, snapshot: before }));
    }
    let result;
    try {
      if (request.operation === "pickup" || request.operation === "place") result = state.adapter.click(request.target ?? {}, undefined, request.modifiers?.button ?? 0);
      else if (request.operation === "quickMove") result = state.adapter.quickMove(request.target?.direction, request.target?.displayIndex ?? request.target?.index);
      else if (request.operation === "setView") result = state.adapter.setView({ page: request.target?.page, layout: request.target?.layout, rarity: request.target?.rarity });
      else result = state.adapter.organize();
    } catch (adapterError) {
      try {
        rollback(before.adapter);
      } catch (rollbackError) {
        throw new Error("fatal adapter rollback failure", { cause: rollbackError });
      }
      return clone(cache(request, { accepted: false, reason: "invalid", revision: state.revision, viewGeneration: state.viewGeneration, requestId: request.requestId, snapshot: snapshot() }));
    }
    if (!result?.accepted) {
      try {
        rollback(before.adapter);
      } catch (rollbackError) {
        throw new Error("fatal adapter rollback failure", { cause: rollbackError });
      }
    }
    if (result?.accepted && result.changed !== false && request.operation !== "setView") state.revision += 1;
    if (result?.accepted && request.operation === "setView" && result.changed !== false) {
      const after = adapterSnapshot();
      if (before.adapter.layout !== after.layout || before.adapter.rarity !== after.rarity || before.adapter.page !== after.page) state.viewGeneration += 1;
    }
    return clone(cache(request, {
      accepted: Boolean(result?.accepted),
      reason: result?.reason ?? (result?.accepted ? "ok" : "rejected"),
      revision: state.revision,
      viewGeneration: state.viewGeneration,
      requestId: request.requestId,
      snapshot: snapshot(),
      result,
    }));
  }
  return Object.freeze({ handle, snapshot, summary, get seenRequestIds() { return [...seen]; } });
}
