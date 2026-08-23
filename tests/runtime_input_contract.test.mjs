import test from "node:test";
import assert from "node:assert/strict";
import { cssPointToLogicalPoint, createHitTester, hoverTransition, normalizeInput, pointerGesture } from "../emulator/runtime/input.js";

test("logical coordinates are viewport-scale independent and use half-open rectangles", () => {
  assert.deepEqual(cssPointToLogicalPoint({ x: 480, y: 270 }, { left: 0, top: 0, width: 960, height: 540 }), { x: 237, y: 163 });
  assert.deepEqual(cssPointToLogicalPoint({ x: 640, y: 360 }, { left: 0, top: 0, width: 1280, height: 720 }), { x: 237, y: 163 });
  const hit = createHitTester([{ kind: "container", rect: { left: 10, top: 10, width: 20, height: 20 }, target: "bg" }, { kind: "slot", rect: { left: 10, top: 10, width: 20, height: 20 }, target: "slot" }]);
  assert.equal(hit.hitTest({ x: 10, y: 10 }), "slot");
  assert.equal(hit.hitTest({ x: 30, y: 20 }), null);
});

test("input normalization rejects unknown, non-finite and out-of-range values", () => {
  assert.equal(normalizeInput({ type: "pointerdown", x: 1, y: 2, button: 0, buttons: 1, deltaY: 0, tick: 0 }).type, "pointerdown");
  for (const value of [{ type: "wat", x: 0, y: 0 }, { type: "pointermove", x: Infinity, y: 0 }, { type: "pointermove", x: -1, y: 0 }, { type: "pointermove", x: 0, y: 0, buttons: 8 }]) assert.throws(() => normalizeInput(value));
  assert.deepEqual(hoverTransition(null, "slot"), { type: "enter", from: null, to: "slot" });
  assert.deepEqual(hoverTransition("slot", null), { type: "leave", from: "slot", to: null });
});

test("hit registration validates and snapshots rects and targets", () => {
  for (const rect of [{ left: 0, top: 0, width: 0, height: 1 }, { left: 0, top: 0, width: 1, height: Infinity }, { left: 0, top: 0, width: -1, height: 1 }]) assert.throws(() => createHitTester([{ kind: "slot", rect, target: "x" }]));
  const target = { id: "slot", nested: { value: 1 } }; const rect = { left: 0, top: 0, width: 10, height: 10 }; const hit = createHitTester([{ kind: "container", rect, target }, { kind: "widget", rect, target: "widget" }, { kind: "slot", rect, target: "first" }, { kind: "slot", rect, target: "second" }, { kind: "adapter", rect, target: "adapter" }]);
  target.nested.value = 9; rect.width = 0;
  assert.equal(hit.hitTest({ x: 0, y: 0 }), "adapter");
  assert.equal(hit.registrations()[2].target, "first"); assert.equal(hit.registrations()[2].rect.width, 10);
  const objectHit = createHitTester([{ kind: "adapter", rect: { left: 0, top: 0, width: 10, height: 10 }, target: { id: "adapter" } }]); const returned = objectHit.hitTest({ x: 1, y: 1 }); returned.id = "changed"; assert.equal(objectHit.hitTest({ x: 1, y: 1 }).id, "adapter");
  assert.equal(hit.hitTest({ x: 10, y: 5 }), null);
  assert.equal(hit.hitTest({ x: 5, y: 10 }), null); assert.equal(hit.hitTest({ x: 11, y: 5 }), null); assert.equal(hit.hitTest({ x: 5, y: 11 }), null);
});

test("hover and pointer gestures preserve same/switch/leave and button modifiers", () => {
  assert.deepEqual(hoverTransition("slot", "slot"), { type: "move", from: "slot", to: "slot" });
  assert.deepEqual(hoverTransition("slot", "widget"), { type: "leave", from: "slot", to: "widget", then: "enter" });
  for (const button of [0, 1, 2]) { const gesture = pointerGesture({ type: "pointerdown", x: 1, y: 2, button, buttons: 1 << button, shiftKey: true, tick: 4 }); assert.equal(gesture.button, button); assert.equal(gesture.shiftKey, true); }
});
