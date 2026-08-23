const clone = value => structuredClone(value);
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])); return value; }
function nonNegativeSafeInteger(value, name) { if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${name} must be a non-negative safe integer`); return value; }

export function createDeterministicTransport(options = {}) {
  if (typeof options.handler !== "function") throw new TypeError("handler required");
  let tick = 0; let sequence = 0; const queue = []; const trace = [];
  const delayFn = options.delay ?? (() => 0); const duplicateFn = options.duplicate ?? (() => 0); const reorderFn = options.reorder ?? (ready => ready);
  function enqueueInternal(request, dueTick, applyInjection = true) { const duplicate = applyInjection ? duplicateFn(request) : 0; const copies = nonNegativeSafeInteger(duplicate, "duplicate"); const due = dueTick ?? tick + nonNegativeSafeInteger(applyInjection ? delayFn(request) : 0, "delay"); for (let i = 0; i <= copies; i += 1) queue.push({ due, sequence: sequence++, request: clone(request) }); return queue.length; }
  function enqueue(request) { return enqueueInternal(request); }
  function readyAtCurrentTick() {
    const ready = queue.filter(item => item.due <= tick); for (const item of ready) queue.splice(queue.indexOf(item), 1);
    const ordered = reorderFn(ready.map(item => ({ due: item.due, sequence: item.sequence, request: clone(item.request) })));
    if (!Array.isArray(ordered) || ordered.length !== ready.length) throw new TypeError("reorder must return every ready entry exactly once");
    const expected = new Set(ready.map(item => item.sequence)); const seen = new Set(); for (const item of ordered) { if (!item || !expected.has(item.sequence) || seen.has(item.sequence)) throw new TypeError("reorder must return every ready entry exactly once"); seen.add(item.sequence); }
    if (seen.size !== expected.size) throw new TypeError("reorder must return every ready entry exactly once");
    for (const item of ordered) { const response = options.handler(clone(item.request)); trace.push({ tick, sequence: item.sequence, request: clone(item.request), response: clone(response) }); }
    return ready.length;
  }
  function tickOnce() { tick += 1; return readyAtCurrentTick(); }
  function drain(limit = 10000) { nonNegativeSafeInteger(limit, "limit"); let count = 0; while (queue.length && count < limit) { tickOnce(); count += 1; } if (queue.length) throw new Error("transport drain limit exceeded"); return getTrace(); }
  function traceDocument() { return { version: 1, entries: trace, finalTick: tick, queue: queue.map(item => ({ due: item.due, sequence: item.sequence, request: item.request })) }; }
  function getTrace() { return stable(clone(traceDocument())); }
  function getSnapshot() { const handlerSnapshot = typeof options.snapshot === "function" ? options.snapshot() : undefined; return stable(clone({ tick, queue: queue.map(item => ({ due: item.due, sequence: item.sequence, request: item.request })), trace, handlerSnapshot })); }
  function enqueueTrace(request, due, traceSequence) {
    const exactSequence = nonNegativeSafeInteger(traceSequence, "sequence");
    queue.push({ due: nonNegativeSafeInteger(due, "tick"), sequence: exactSequence, request: clone(request) });
    sequence = Math.max(sequence, exactSequence + 1);
  }
  return Object.freeze({ enqueue, tick: tickOnce, drain, getTrace, getSnapshot, _enqueueAt: (request, due) => enqueueInternal(request, nonNegativeSafeInteger(due, "tick"), false), _enqueueTrace: enqueueTrace, _flush: readyAtCurrentTick });
}

export function replayTrace(traceDocument, factory) {
  const legacy = Array.isArray(traceDocument);
  const entries = legacy ? traceDocument : traceDocument?.entries;
  if (!Array.isArray(entries) || typeof factory !== "function") throw new TypeError("trace and factory required");
  const finalTick = legacy ? (entries.at(-1)?.tick ?? 0) : nonNegativeSafeInteger(traceDocument.finalTick, "finalTick");
  const pendingQueue = legacy ? [] : traceDocument.queue;
  if (!Array.isArray(pendingQueue)) throw new TypeError("trace queue must be an array");
  const transport = factory(); let current = 0; let index = 0;
  while (index < entries.length) {
    const targetTick = nonNegativeSafeInteger(entries[index].tick, "trace tick"); if (targetTick < current) throw new RangeError("trace ticks must be ordered");
    while (current < targetTick) { transport.tick(); current += 1; }
    while (index < entries.length && entries[index].tick === targetTick) { if (!entries[index].request) throw new TypeError("invalid trace entry"); transport._enqueueTrace(entries[index].request, targetTick, entries[index].sequence); index += 1; }
    transport._flush();
  }
  while (current < finalTick) { transport.tick(); current += 1; }
  for (const pending of pendingQueue) {
    if (!pending || !pending.request) throw new TypeError("invalid pending trace entry");
    transport._enqueueTrace(pending.request, pending.due, pending.sequence);
  }
  return { trace: transport.getTrace(), snapshot: transport.getSnapshot() };
}

export const stableTraceClone = value => stable(clone(value));
