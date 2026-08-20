import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildCaptureMatrix, parseCaptureArgs } from "../tools/browser-capture/capture.mjs";
import { CAPTURE_SCHEMA, browserCaptureMetadata, captureFileStem, compareCaptureMetadata, validateCaptureMetadata } from "../tools/capture-contract.mjs";
import { comparePair, comparisonMetadata, diffPixels } from "../tools/visual-compare/compare-core.mjs";

const project = JSON.parse(fs.readFileSync(new URL("../emulator/projects/cte2/project.json", import.meta.url), "utf8"));

test("batch capture expands a deterministic screen and fixture matrix", () => {
  const options = parseCaptureArgs(["--screens", "map_stash,master_stash", "--fixtures", "empty,many", "--locales", "ja,en", "--states", "normal", "--variants", "rail_dual", "--scale", "1"]);
  const matrix = buildCaptureMatrix(project, options);
  assert.equal(matrix.length, 8);
  assert.deepEqual(matrix.map((entry) => `${entry.screen}:${entry.fixture}:${entry.locale}:${entry.variant || "default"}`), [
    "map_stash:empty:ja:default", "map_stash:empty:en:default", "map_stash:many:ja:default", "map_stash:many:en:default",
    "master_stash:empty:ja:rail_dual", "master_stash:empty:en:rail_dual", "master_stash:many:ja:rail_dual", "master_stash:many:en:rail_dual",
  ]);
  for (const entry of matrix) {
    assert.equal(entry.query.get("capture"), "1");
    assert.equal(entry.query.get("alignment"), entry.alignment.status);
  }
});

test("capture metadata and filenames preserve the canonical audit dimensions", () => {
  const metadata = browserCaptureMetadata({ project: "cte2", screen: "master_stash", fixture: "many", state: "normal", locale: "ja", variant: "rail_dual", alignment: { status: "production-derived", source: "contract" }, logicalSize: { width: 650, height: 350 }, pixelSize: { width: 960, height: 540 }, guiScale: 2, canonicalUrl: "index.html?screen=master_stash", image: "capture.png" });
  assert.equal(metadata.schema, CAPTURE_SCHEMA);
  assert.equal(validateCaptureMetadata(metadata).valid, true);
  assert.match(metadata.limitations[0], /No matching Forge capture/);
  assert.equal(captureFileStem(metadata), "browser__cte2__master_stash__many__normal__ja__rail_dual__650x350__viewport960x540__scale2");
  assert.equal(compareCaptureMetadata(metadata, structuredClone(metadata)).compatible, true);
  const mismatch = structuredClone(metadata); mismatch.fixture = "empty";
  assert.deepEqual(compareCaptureMetadata(metadata, mismatch).mismatches.map((entry) => entry.field), ["fixture"]);
});

test("visual comparison blocks metadata drift and thresholds pixel noise without declaring a defect", () => {
  const left = browserCaptureMetadata({ project: "cte2", screen: "map_stash", fixture: "normal", state: "normal", locale: "ja", variant: null, alignment: { status: "production-derived", source: "contract" }, logicalSize: { width: 2, height: 1 }, pixelSize: { width: 2, height: 1 }, guiScale: 1, canonicalUrl: "index.html", image: "left.png" });
  const right = { ...structuredClone(left), image: "right.png" };
  assert.equal(comparePair(left, right).compatible, true);
  right.locale = "en";
  assert.equal(comparePair(left, right).compatible, false);
  right.locale = "ja";
  const diff = diffPixels(new Uint8ClampedArray([10, 10, 10, 255, 100, 100, 100, 255]), new Uint8ClampedArray([15, 15, 15, 255, 140, 100, 100, 255]), 16);
  assert.equal(diff.changedPixels, 1);
  assert.equal(diff.totalPixels, 2);
  const metadata = comparisonMetadata(left, right, "difference", diff);
  assert.match(metadata.interpretation, /not automatically product defects/);
  assert.equal(metadata.difference.threshold, 16);
});
