export const FIXTURE_SCHEMA = "forge-ui-inspector.fixture";
export const PROJECT_SCHEMA = "forge-ui-inspector.project";
export const PROJECT_INDEX_SCHEMA = "forge-ui-inspector.project-index";
export const DEFAULT_PROJECT_ID = "cte2";
export const PAGE_SIZE = 54;

const CTE2_SCREENS = [
  { id: "map_stash", labelKey: "screen.forgeuiinspector.title", renderer: "compact-stash", width: 320, height: 230, fixtureFile: "map-stash", fixturePath: "../../fixtures/map-stash.json" },
  { id: "currency_stash", labelKey: "screen.forgeuiinspector.currencyTitle", renderer: "compact-stash", width: 320, height: 230, fixtureFile: "currency-stash", fixturePath: "../../fixtures/currency-stash.json" },
  { id: "master_stash", labelKey: "screen.forgeuiinspector.master.title", renderer: "master-stash", width: 650, height: 350, fixtureFile: "master-stash", fixturePath: "../../fixtures/master-stash.json" },
  { id: "profession_workshop", labelKey: "screen.forgeuiinspector.profession.title", renderer: "profession-workshop", width: 620, height: 340, fixtureFile: "profession-workshop", fixturePath: "../../fixtures/profession-workshop.json" },
  { id: "advanced_salvage", labelKey: "screen.forgeuiinspector.salvage.title", renderer: "advanced-salvage", width: 960, height: 540, fixtureFile: "advanced-salvage", fixturePath: "../../fixtures/advanced-salvage.json" },
];

export const DEFAULT_CTE2_PROJECT = Object.freeze({
  schema: PROJECT_SCHEMA,
  version: 1,
  id: DEFAULT_PROJECT_ID,
  labelKey: "project.cte2.name",
  defaultScreen: "map_stash",
  screens: Object.freeze(CTE2_SCREENS.map((screen) => Object.freeze({ ...screen, logicalSize: Object.freeze({ width: screen.width, height: screen.height }) }))),
});

export const DEFAULT_PROJECT_INDEX = Object.freeze({
  schema: PROJECT_INDEX_SCHEMA,
  version: 1,
  defaultProject: DEFAULT_PROJECT_ID,
  projects: Object.freeze([{ id: DEFAULT_PROJECT_ID, labelKey: "project.cte2.name", manifest: "cte2/project.json" }]),
});

const ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

function result(errors) {
  return { valid: errors.length === 0, errors };
}

export function screenIdsFor(project = DEFAULT_CTE2_PROJECT) {
  return (Array.isArray(project?.screens) ? project.screens : DEFAULT_CTE2_PROJECT.screens).map((screen) => screen.id);
}

export function screenMetaFor(project = DEFAULT_CTE2_PROJECT, screenId = "map_stash") {
  const screens = Array.isArray(project?.screens) ? project.screens : DEFAULT_CTE2_PROJECT.screens;
  const selected = screens.find((screen) => screen.id === screenId) ?? screens[0] ?? DEFAULT_CTE2_PROJECT.screens[0];
  const logicalSize = selected.logicalSize ?? {};
  return {
    ...selected,
    width: Number.isFinite(Number(selected.width)) ? Number(selected.width) : Number(logicalSize.width) || 320,
    height: Number.isFinite(Number(selected.height)) ? Number(selected.height) : Number(logicalSize.height) || 230,
    renderer: selected.renderer || "generic",
  };
}

export function rendererFor(project = DEFAULT_CTE2_PROJECT, screenId = "map_stash") {
  return screenMetaFor(project, screenId).renderer;
}

export function validateProjectManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return result(["project manifest must be an object"]);
  if (manifest.schema !== PROJECT_SCHEMA) errors.push(`schema must be ${PROJECT_SCHEMA}`);
  if (manifest.version !== 1) errors.push("version must be 1");
  if (typeof manifest.id !== "string" || !ID_PATTERN.test(manifest.id)) errors.push("id must match /^[a-z0-9][a-z0-9_-]*$/");
  if (!Array.isArray(manifest.screens) || manifest.screens.length === 0) errors.push("screens must contain at least one screen");
  const ids = new Set();
  for (const screen of manifest.screens ?? []) {
    if (!screen || typeof screen !== "object") { errors.push("screen must be an object"); continue; }
    if (typeof screen.id !== "string" || !ID_PATTERN.test(screen.id)) errors.push("screen id is invalid");
    if (ids.has(screen.id)) errors.push(`duplicate screen id: ${screen.id}`);
    ids.add(screen.id);
    if (typeof screen.labelKey !== "string" || screen.labelKey.length === 0) errors.push(`screen ${screen.id} needs labelKey`);
    if (typeof screen.fixturePath !== "string" || screen.fixturePath.length === 0) errors.push(`screen ${screen.id} needs fixturePath`);
    const meta = screenMetaFor({ screens: [screen] }, screen.id);
    if (!(meta.width > 0) || !(meta.height > 0)) errors.push(`screen ${screen.id} needs positive logicalSize`);
  }
  if (typeof manifest.defaultScreen !== "string" || !ids.has(manifest.defaultScreen)) errors.push("defaultScreen must reference a screen");
  return result(errors);
}

export function validateFixtureDocument(data, expected = {}) {
  const errors = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) return result(["fixture document must be an object"]);
  if (data.schema !== FIXTURE_SCHEMA) errors.push(`schema must be ${FIXTURE_SCHEMA}`);
  if (data.version !== 1) errors.push("version must be 1");
  if (expected.project && data.project !== expected.project) errors.push(`project must be ${expected.project}`);
  if (expected.screen && data.screen !== expected.screen) errors.push(`screen must be ${expected.screen}`);
  if (typeof data.project !== "string" || !ID_PATTERN.test(data.project)) errors.push("project must be a valid id");
  if (typeof data.screen !== "string" || !ID_PATTERN.test(data.screen)) errors.push("screen must be a valid id");
  if (typeof data.renderer !== "string" || data.renderer.length === 0) errors.push("renderer must be a non-empty string");
  if (!Number.isInteger(data.pageSize) || data.pageSize <= 0) errors.push("pageSize must be a positive integer");
  const fixtureIds = new Set();
  for (const fixture of data.fixtures ?? []) {
    if (!fixture || typeof fixture !== "object") { errors.push("fixture must be an object"); continue; }
    if (typeof fixture.id !== "string" || !ID_PATTERN.test(fixture.id)) errors.push("fixture id is invalid");
    if (fixtureIds.has(fixture.id)) errors.push(`duplicate fixture id: ${fixture.id}`);
    fixtureIds.add(fixture.id);
    if (!Array.isArray(fixture.layouts)) errors.push(`fixture ${fixture.id} needs layouts`);
    const layoutIds = new Set();
    for (const layout of fixture.layouts ?? []) {
      if (!layout || typeof layout !== "object") { errors.push(`fixture ${fixture.id} has invalid layout`); continue; }
      if (typeof layout.id !== "string" || !ID_PATTERN.test(layout.id)) errors.push(`fixture ${fixture.id} has invalid layout id`);
      if (layoutIds.has(layout.id)) errors.push(`duplicate layout id: ${layout.id}`);
      layoutIds.add(layout.id);
      if (layout.count !== undefined && (!Number.isInteger(layout.count) || layout.count < 0)) errors.push(`layout ${layout.id} count must be non-negative`);
    }
    const items = Array.isArray(fixture.items) ? fixture.items : [];
    for (const item of items) {
      if (!Number.isInteger(item?.slot) || item.slot < 0 || item.slot >= data.pageSize) errors.push(`fixture ${fixture.id} has an invalid slot`);
      if (item?.count !== undefined && (!Number.isFinite(Number(item.count)) || Number(item.count) < 0)) errors.push(`fixture ${fixture.id} has an invalid item count`);
    }
    if (fixture.itemCount !== undefined && (!Number.isInteger(fixture.itemCount) || fixture.itemCount < 0)) errors.push(`fixture ${fixture.id} itemCount must be non-negative`);
  }
  if (!Array.isArray(data.fixtures) || data.fixtures.length === 0) errors.push("fixtures must contain at least one fixture");
  for (const required of ["normal", "empty", "many", "other"]) if (!fixtureIds.has(required)) errors.push(`missing fixture: ${required}`);
  return result(errors);
}

export function createFixtureRegistry(projects = []) {
  const projectMap = new Map();
  const registry = {
    registerProject(project) {
      const validation = validateProjectManifest(project);
      if (!validation.valid) throw new Error(validation.errors.join("; "));
      projectMap.set(project.id, project);
      return project;
    },
    getProject(id) { return projectMap.get(id) ?? null; },
    listProjects() { return [...projectMap.values()]; },
    screenIds(projectId = DEFAULT_PROJECT_ID) { return screenIdsFor(projectMap.get(projectId) ?? DEFAULT_CTE2_PROJECT); },
    getScreen(projectId, screenId) { const project = projectMap.get(projectId); return project ? screenMetaFor(project, screenId) : null; },
  };
  registry.registerProject(DEFAULT_CTE2_PROJECT);
  for (const project of projects) registry.registerProject(project);
  return registry;
}

export function createProjectIndex(projects = []) {
  return {
    schema: PROJECT_INDEX_SCHEMA,
    version: 1,
    defaultProject: projects[0]?.id ?? DEFAULT_PROJECT_ID,
    projects: projects.map((project) => ({ id: project.id, labelKey: project.labelKey, manifest: project.manifest ?? `${project.id}/project.json` })),
  };
}

export { ID_PATTERN };
