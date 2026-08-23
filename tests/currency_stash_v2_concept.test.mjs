import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  FIXTURE_IDS,
  iconGlyph,
  t,
  validateFixtureDocument,
  validateProjectManifest,
} from "../emulator/emulator.js";

const project = JSON.parse(fs.readFileSync(new URL("../emulator/projects/mnsutilities-concepts/project.json", import.meta.url), "utf8"));
const fixture = JSON.parse(fs.readFileSync(new URL("../emulator/projects/mnsutilities-concepts/fixtures/currency_stash_v2.json", import.meta.url), "utf8"));
const categoryIds = ["all", "gear", "maps", "gems", "runes", "rarity_stones", "seasonal", "special", "other"];

function gemValue(counts) {
  return counts.reduce((total, count, rank) => total + count * (3 ** rank), 0);
}

test("currency stash v2 concept owns a deterministic 474x326 screen contract", () => {
  assert.equal(validateProjectManifest(project).valid, true);
  assert.equal(project.defaultScreen, "currency_stash_v2");
  assert.equal(project.screens.length, 1);
  assert.equal(project.screens[0].renderer, "currency-stash-v2");
  assert.deepEqual(project.screens[0].logicalSize, { width: 474, height: 326 });
  assert.deepEqual(project.screens[0].grid, { columns: 12, rows: 6, slots: 72 });
});

test("currency and gem concept fixtures cover normal, empty, many, and non-standard states", () => {
  const result = validateFixtureDocument(fixture, { project: project.id, screen: "currency_stash_v2", pageSize: 72 });
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.deepEqual(fixture.fixtures.map((candidate) => candidate.id), FIXTURE_IDS);
  for (const state of fixture.fixtures) {
    assert.deepEqual(state.layouts.map((layout) => layout.id), categoryIds, state.id);
    assert.equal(new Set(state.layouts.map((layout) => layout.id)).size, categoryIds.length, state.id);
  }
  assert.equal(fixture.fixtures.find((state) => state.id === "empty").items.length, 0);
  assert.equal(fixture.fixtures.find((state) => state.id === "many").items.length, 73);
  assert.ok(fixture.fixtures.find((state) => state.id === "other").items.some((item) => item.category === "gems"));
});

test("every gem preview conserves 3-to-1 material value and never crafts Pinnacle", () => {
  for (const state of fixture.fixtures) {
    assert.equal(state.gemPlan.before.length, 8, state.id);
    assert.equal(state.gemPlan.after.length, 8, state.id);
    assert.equal(gemValue(state.gemPlan.before), gemValue(state.gemPlan.after), state.id);
    assert.equal(state.gemPlan.craftableMaxRank, 6, state.id);
    assert.ok(state.gemPlan.targetRank <= state.gemPlan.craftableMaxRank, state.id);
    assert.equal(state.gemPlan.before[7], state.gemPlan.after[7], state.id);
  }
});

test("concept labels and representative icons exist in Japanese and English", () => {
  const keys = [
    "project.mnsutilities_concepts.name",
    "screen.mnsutilities.currency_stash_v2",
    "screen.mnsutilities.mode.currency",
    "screen.mnsutilities.mode.gems",
    "screen.mnsutilities.gems.nonstandard_rejected",
    "screen.mnsutilities.gems.pinnacle_locked",
  ];
  for (const locale of ["ja", "en"]) {
    for (const key of keys) assert.notEqual(t(key, locale), key, `${locale}: ${key}`);
  }
  assert.equal(iconGlyph("gem_red").className, "icon-gem-red");
  assert.equal(iconGlyph("rune").glyph, "R");
  assert.equal(iconGlyph("rarity_stone").className, "icon-rarity-stone");
});
