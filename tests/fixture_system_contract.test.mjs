import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_CTE2_PROJECT,
  DEFAULT_PROJECT_INDEX,
  PROJECT_INDEX_SCHEMA,
  PROJECT_SCHEMA,
  FIXTURE_SCHEMA,
  createFixtureRegistry,
  createGenericFallbackData,
  canonical,
  normalize,
  validateFixtureDocument,
  validateProjectManifest,
} from "../emulator/emulator.js";

const projectIndex = JSON.parse(fs.readFileSync(new URL("../emulator/projects/index.json", import.meta.url), "utf8"));
const project = JSON.parse(fs.readFileSync(new URL("../emulator/projects/cte2/project.json", import.meta.url), "utf8"));

test("project catalog and CTE2 manifest use the generic schemas", () => {
  assert.equal(projectIndex.schema, PROJECT_INDEX_SCHEMA);
  assert.equal(projectIndex.defaultProject, "cte2");
  assert.equal(validateProjectManifest(project).valid, true);
  assert.equal(project.schema, PROJECT_SCHEMA);
  assert.deepEqual(project.screens.map((screen) => screen.id), ["map_stash", "currency_stash", "master_stash", "profession_workshop", "advanced_salvage"]);
  assert.deepEqual(DEFAULT_PROJECT_INDEX.projects.map((entry) => entry.id), ["cte2"]);
  assert.equal(validateProjectManifest(DEFAULT_CTE2_PROJECT).valid, true);
});

test("all registered CTE2 fixtures use the project-scoped fixture schema", () => {
  for (const screen of project.screens) {
    const fixture = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(new URL("../emulator/projects/cte2/project.json", import.meta.url))), screen.fixturePath), "utf8"));
    const validation = validateFixtureDocument(fixture, { project: "cte2", screen: screen.id });
    assert.equal(validation.valid, true, `${screen.id}: ${validation.errors.join(", ")}`);
    assert.equal(fixture.schema, FIXTURE_SCHEMA);
    assert.equal(fixture.renderer, screen.renderer);
  }
});

test("registry accepts a separate project without changing CTE2 ids", () => {
  const demo = {
    schema: PROJECT_SCHEMA,
    version: 1,
    id: "demo",
    labelKey: "project.demo.name",
    defaultScreen: "inventory",
    screens: [{ id: "inventory", labelKey: "screen.demo.inventory", renderer: "generic", logicalSize: { width: 360, height: 240 }, fixturePath: "fixtures/inventory.json" }],
  };
  const registry = createFixtureRegistry([demo]);
  assert.deepEqual(registry.listProjects().map((entry) => entry.id), ["cte2", "demo"]);
  assert.deepEqual(registry.screenIds("demo"), ["inventory"]);
  assert.equal(registry.getScreen("demo", "inventory").renderer, "generic");
  const data = createGenericFallbackData(demo, "inventory");
  const state = normalize({ project: "demo", screen: "inventory", fixture: "many", page: 99 }, data, demo);
  assert.equal(state.project, "demo");
  assert.equal(state.page, 1);
  assert.match(canonical(state), /project=demo/);
});

test("invalid project and fixture metadata are reported without throwing", () => {
  assert.equal(validateProjectManifest({ schema: PROJECT_SCHEMA, version: 1, id: "bad id", screens: [] }).valid, false);
  assert.equal(validateFixtureDocument({ schema: FIXTURE_SCHEMA, version: 1, project: "demo", screen: "inventory", pageSize: 54, fixtures: [] }).valid, false);
});
